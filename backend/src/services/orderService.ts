import { pool } from "../db/pool.js";
import { badRequest, conflict, forbidden, notFound } from "../errors.js";
import { env } from "../config/env.js";
import { checkCutoff, fechaServicio } from "../utils/cutoff.js";
import { formatCents, lineTotal, sumCents, toCents } from "../utils/money.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import { createPayment, type PaymentIntent } from "./paymentService.js";

/**
 * Pedidos anticipados (research R1/R2/R4/R6). El total SIEMPRE se calcula
 * aquí con los precios vigentes de `menu_dia` y se congela en el pedido.
 */

export interface OrderItemInput {
  menuDiaId: number;
  cantidad: number;
}

export interface QuoteItem {
  menuDiaId: number;
  nombre: string;
  cantidad: number;
  precio: string;
  subtotal: string;
}

export interface Quote {
  items: QuoteItem[];
  total: string;
  canOrder: boolean;
  reason: string | null;
}

export interface CreatedOrder {
  order: {
    id: number;
    numero: string;
    estado: string;
    total: string;
    fechaRecoleccion: string | null;
  };
  payment: PaymentIntent;
}

export interface OrderDetail {
  id: number;
  numero: string;
  estado: string;
  total: string;
  items: Array<{ nombre: string; cantidad: number; precioUnitario: string; subtotal: string }>;
  pago: { referencia: string; monto: string; metodo: string; fecha: string } | null;
}

interface MenuDiaRow {
  id: number;
  nombre: string;
  precio: string;
  disponible: boolean;
}

async function fetchMenuDiaRows(menuDiaIds: number[]): Promise<Map<number, MenuDiaRow>> {
  const { rows } = await pool.query<MenuDiaRow>(
    `SELECT md.id, p.nombre, md.precio, md.disponible
       FROM menu_dia md
       JOIN platillo p ON p.id = md.platillo_id
      WHERE md.id = ANY($1::int[])`,
    [menuDiaIds],
  );
  return new Map(rows.map((r) => [r.id, r]));
}

function validateItemsShape(items: OrderItemInput[]): void {
  if (items.length === 0) {
    throw badRequest("El pedido debe incluir al menos un platillo");
  }
  for (const item of items) {
    if (!Number.isInteger(item.cantidad) || item.cantidad < 1) {
      throw badRequest("La cantidad de cada platillo debe ser al menos 1");
    }
  }
}

export async function quoteOrder(items: OrderItemInput[]): Promise<Quote> {
  validateItemsShape(items);

  const rows = await fetchMenuDiaRows(items.map((i) => i.menuDiaId));

  const quoteItems: QuoteItem[] = [];
  let allAvailable = true;
  let firstUnavailable: string | null = null;

  for (const item of items) {
    const row = rows.get(item.menuDiaId);
    if (!row) {
      allAvailable = false;
      firstUnavailable = firstUnavailable ?? `El platillo del menú #${item.menuDiaId} no existe`;
      continue;
    }
    if (!row.disponible) {
      allAvailable = false;
      firstUnavailable = firstUnavailable ?? `El platillo "${row.nombre}" no está disponible hoy`;
      continue;
    }
    const cents = toCents(row.precio);
    quoteItems.push({
      menuDiaId: row.id,
      nombre: row.nombre,
      cantidad: item.cantidad,
      precio: formatCents(cents),
      subtotal: formatCents(lineTotal(cents, item.cantidad)),
    });
  }

  const totalCents = sumCents(quoteItems.map((q) => toCents(q.subtotal)));
  const cutoff = checkCutoff(new Date(), {
    cutoffTime: env.CUTOFF_TIME,
    timeZone: env.TZ,
  });

  return {
    items: quoteItems,
    total: formatCents(totalCents),
    canOrder: allAvailable && cutoff.ok,
    reason: !allAvailable ? firstUnavailable : cutoff.reason,
  };
}

export async function createOrder(usuarioId: number, items: OrderItemInput[]): Promise<CreatedOrder> {
  validateItemsShape(items);

  const cutoff = checkCutoff(new Date(), {
    cutoffTime: env.CUTOFF_TIME,
    timeZone: env.TZ,
  });
  if (!cutoff.ok) {
    throw conflict(cutoff.reason ?? "Fuera de la ventana de pedido anticipado");
  }

  const rows = await fetchMenuDiaRows(items.map((i) => i.menuDiaId));
  for (const item of items) {
    const row = rows.get(item.menuDiaId);
    if (!row) {
      throw conflict(`El platillo del menú #${item.menuDiaId} no está en el menú de hoy`);
    }
    if (!row.disponible) {
      throw conflict(`El platillo "${row.nombre}" no está disponible hoy`);
    }
  }

  const ymd = fechaServicio(new Date(), env.TZ).replaceAll("-", "");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: pendienteRows } = await client.query<{ id: number }>(
      `SELECT id FROM estado_pedido WHERE nombre = 'Pendiente'`,
    );
    const pendienteId = pendienteRows[0]?.id;
    if (!pendienteId) throw new Error("Estado 'Pendiente' no sembrado en la base de datos");

    const numero = await generateOrderNumber(
      ymd,
      async () => {
        const { rows: countRows } = await client.query<{ seq: number }>(
          `SELECT COUNT(*) + 1 AS seq FROM pedido WHERE numero LIKE $1`,
          [`PED-${ymd}-%`],
        );
        return Number(countRows[0]?.seq ?? 1);
      },
      async (numeroIntento) => {
        const { rowCount } = await client.query(
          `INSERT INTO pedido (numero, tipo, estado_id, usuario_id, fecha_recoleccion, total)
           VALUES ($1, 'anticipado', $2, $3, CURRENT_DATE, 0)`,
          [numeroIntento, pendienteId, usuarioId],
        );
        return (rowCount ?? 0) > 0;
      },
    );

    const { rows: pedidoRows } = await client.query<{ id: number }>(
      `SELECT id FROM pedido WHERE numero = $1`,
      [numero],
    );
    const pedidoId = pedidoRows[0]?.id;
    if (!pedidoId) throw new Error("Pedido recién creado no encontrado");

    let totalCents = 0;
    for (const item of items) {
      const row = rows.get(item.menuDiaId)!;
      const unitCents = toCents(row.precio);
      const subtotalCents = lineTotal(unitCents, item.cantidad);
      totalCents += subtotalCents;

      await client.query(
        `INSERT INTO pedido_detalle (pedido_id, menu_dia_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [pedidoId, item.menuDiaId, item.cantidad, (unitCents / 100).toFixed(2), (subtotalCents / 100).toFixed(2)],
      );
    }

    await client.query(`UPDATE pedido SET total = $1 WHERE id = $2`, [
      (totalCents / 100).toFixed(2),
      pedidoId,
    ]);

    await client.query(
      `INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id)
       VALUES ($1, NULL, $2)`,
      [pedidoId, pendienteId],
    );

    await client.query("COMMIT");

    const payment = await createPayment(pedidoId, totalCents);

    return {
      order: {
        id: pedidoId,
        numero,
        estado: "Pendiente",
        total: formatCents(totalCents),
        fechaRecoleccion: null,
      },
      payment,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrder(orderId: number, user: { id: number; rol: string }): Promise<OrderDetail> {
  const { rows } = await pool.query<{
    id: number;
    numero: string;
    estado: string;
    total: string;
    usuario_id: number | null;
  }>(
    `SELECT p.id, p.numero, ep.nombre AS estado, p.total, p.usuario_id
       FROM pedido p
       JOIN estado_pedido ep ON ep.id = p.estado_id
      WHERE p.id = $1`,
    [orderId],
  );
  const order = rows[0];
  if (!order) throw notFound("Pedido no encontrado");
  if (order.usuario_id !== user.id && user.rol !== "administrador") {
    throw forbidden("No tienes permiso para ver este pedido");
  }

  const { rows: detailRows } = await pool.query<{
    nombre: string;
    cantidad: number;
    precio_unitario: string;
    subtotal: string;
  }>(
    `SELECT pl.nombre, pd.cantidad, pd.precio_unitario, pd.subtotal
       FROM pedido_detalle pd
       JOIN menu_dia md ON md.id = pd.menu_dia_id
       JOIN platillo pl ON pl.id = md.platillo_id
      WHERE pd.pedido_id = $1
      ORDER BY pd.id`,
    [orderId],
  );

  const { rows: pagoRows } = await pool.query<{
    referencia: string;
    monto: string;
    metodo: string;
    fecha: string;
  }>(
    `SELECT referencia, monto, metodo, TO_CHAR(fecha, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha
       FROM pago WHERE pedido_id = $1`,
    [orderId],
  );

  return {
    id: order.id,
    numero: order.numero,
    estado: order.estado,
    total: formatCents(toCents(order.total)),
    items: detailRows.map((d) => ({
      nombre: d.nombre,
      cantidad: d.cantidad,
      precioUnitario: formatCents(toCents(d.precio_unitario)),
      subtotal: formatCents(toCents(d.subtotal)),
    })),
    pago: pagoRows[0]
      ? {
          referencia: pagoRows[0].referencia,
          monto: formatCents(toCents(pagoRows[0].monto)),
          metodo: pagoRows[0].metodo,
          fecha: pagoRows[0].fecha,
        }
      : null,
  };
}

export async function cancelOrder(orderId: number, user: { id: number; rol: string }): Promise<OrderDetail> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{
      id: number;
      estado_id: number;
      estado: string;
      usuario_id: number | null;
    }>(
      `SELECT p.id, p.estado_id, ep.nombre AS estado, p.usuario_id
         FROM pedido p
         JOIN estado_pedido ep ON ep.id = p.estado_id
        WHERE p.id = $1
        FOR UPDATE`,
      [orderId],
    );
    const order = rows[0];
    if (!order) throw notFound("Pedido no encontrado");
    if (order.usuario_id !== user.id && user.rol !== "administrador") {
      throw forbidden("No tienes permiso para cancelar este pedido");
    }

    if (order.estado !== "Pendiente" && order.estado !== "Pagado") {
      throw conflict(`Un pedido en estado "${order.estado}" no se puede cancelar`);
    }

    const { rows: canceladoRows } = await client.query<{ id: number }>(
      `SELECT id FROM estado_pedido WHERE nombre = 'Cancelado'`,
    );
    const canceladoId = canceladoRows[0]?.id;
    if (!canceladoId) throw new Error("Estado 'Cancelado' no sembrado en la base de datos");

    const { rows: transitionRows } = await client.query(
      `SELECT 1 FROM transicion_estado WHERE desde_id = $1 AND hacia_id = $2`,
      [order.estado_id, canceladoId],
    );
    if (!transitionRows[0]) throw conflict("Transición de estado no permitida");

    await client.query(`UPDATE pedido SET estado_id = $1 WHERE id = $2`, [canceladoId, orderId]);
    await client.query(
      `INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
       VALUES ($1, $2, $3, $4)`,
      [orderId, order.estado_id, canceladoId, user.id],
    );

    await client.query("COMMIT");

    return getOrder(orderId, user);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
