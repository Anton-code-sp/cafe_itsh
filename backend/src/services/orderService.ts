import { pool } from "../db/pool.js";
import { badRequest, conflict, forbidden, notFound } from "../errors.js";
import { env } from "../config/env.js";
import { checkCutoff, fechaServicio } from "../utils/cutoff.js";
import { formatCents, lineTotal, sumCents, toCents } from "../utils/money.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import { createPayment, type PaymentIntent } from "./paymentService.js";
import * as notificationService from "./notificationService.js";

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

/**
 * Única puerta para cambiar el estado de un pedido (research R1 — sprint 4).
 *
 * Valida la transición contra la tabla `transicion_estado` (los datos son la
 * única fuente de verdad), actualiza `pedido.estado_id` e inserta el historial
 * con `cambiado_por` en la misma transacción. Toda transición inválida o
 * pedido inexistente responde 409/404 sin tocar la fila.
 */
export async function transitionOrder(
  orderId: number,
  haciaNombre: string,
  actorId: number,
): Promise<{ id: number; estado: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{
      id: number;
      estado_id: number;
      numero: string;
      total: string;
      usuario_id: number | null;
      estado: string;
    }>(
      `SELECT p.id, p.estado_id, p.numero, p.total, p.usuario_id, ep.nombre AS estado
         FROM pedido p
         JOIN estado_pedido ep ON ep.id = p.estado_id
        WHERE p.id = $1
        FOR UPDATE`,
      [orderId],
    );
    const order = rows[0];
    if (!order) throw notFound("Pedido no encontrado");

    const { rows: haciaRows } = await client.query<{ id: number }>(
      `SELECT id FROM estado_pedido WHERE nombre = $1`,
      [haciaNombre],
    );
    const haciaId = haciaRows[0]?.id;
    if (!haciaId) throw new Error(`Estado '${haciaNombre}' no sembrado en la base de datos`);

    const { rows: transitionRows } = await client.query(
      `SELECT 1 FROM transicion_estado WHERE desde_id = $1 AND hacia_id = $2`,
      [order.estado_id, haciaId],
    );
    if (!transitionRows[0]) {
      throw conflict(`La operación no está permitida: ${order.estado} → ${haciaNombre}`);
    }

    await client.query(`UPDATE pedido SET estado_id = $1 WHERE id = $2`, [haciaId, orderId]);
    await client.query(
      `INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
       VALUES ($1, $2, $3, $4)`,
      [orderId, order.estado_id, haciaId, actorId],
    );

    // Aviso de pedido listo en la MISMA transacción (006 research R1):
    // solo hacia `Listo` y solo si el pedido tiene dueño conocido.
    const haciaListo = haciaNombre === "Listo" && typeof order.usuario_id === "number";
    if (haciaListo) {
      await notificationService.createAndEnqueue(client, {
        usuarioId: order.usuario_id as number,
        pedidoId: orderId,
        numero: order.numero,
        estado: haciaNombre,
        total: String(order.total),
      });
    }

    await client.query("COMMIT");

    if (haciaListo) {
      void notificationService.flushPending().catch(() => undefined);
    }

    return { id: orderId, estado: haciaNombre };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export interface CreatedCounterOrder {
  order: {
    id: number;
    numero: string;
    tipo: "mostrador";
    estado: string;
    total: string;
  };
  pago: { metodo: string; monto: string };
}

export interface RecentCounterOrder {
  id: number;
  numero: string;
  estado: string;
  total: string;
  creadoEn: string;
}

/**
 * Pedidos de mostrador (research R2/R5 — sprint 4). El cajero cobra en el
 * momento: el pedido nace directamente en `Pagado` con pago `efectivo`,
 * detalles y historial en una sola transacción. El total SIEMPRE sale de los
 * precios vigentes del menú; `montoRecibido` solo debe cubrirlo (el cambio se
 * calcula en el frontend).
 */
export async function createCounterOrder(
  cajeroId: number,
  items: OrderItemInput[],
  montoRecibido: string | number,
  clienteNombre?: string,
): Promise<CreatedCounterOrder> {
  validateItemsShape(items);

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

  const totalCents = sumCents(
    items.map((item) => lineTotal(toCents(rows.get(item.menuDiaId)!.precio), item.cantidad)),
  );
  if (toCents(montoRecibido) < totalCents) {
    throw badRequest("El monto recibido es menor que el total del pedido");
  }

  const ymd = fechaServicio(new Date(), env.TZ).replaceAll("-", "");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: pagadoRows } = await client.query<{ id: number }>(
      `SELECT id FROM estado_pedido WHERE nombre = 'Pagado'`,
    );
    const pagadoId = pagadoRows[0]?.id;
    if (!pagadoId) throw new Error("Estado 'Pagado' no sembrado en la base de datos");

    const numero = await generateOrderNumber(
      ymd,
      async () => {
        const { rows: countRows } = await client.query<{ seq: number }>(
          `SELECT COUNT(*) + 1 AS seq FROM pedido WHERE numero LIKE $1`,
          [`MOS-${ymd}-%`],
        );
        return Number(countRows[0]?.seq ?? 1);
      },
      async (numeroIntento) => {
        const { rowCount } = await client.query(
          `INSERT INTO pedido (numero, tipo, estado_id, cliente_nombre, fecha_recoleccion, total)
           VALUES ($1, 'mostrador', $2, $3, CURRENT_DATE, $4)`,
          [numeroIntento, pagadoId, clienteNombre ?? null, (totalCents / 100).toFixed(2)],
        );
        return (rowCount ?? 0) > 0;
      },
      10,
      "MOS",
    );

    const { rows: pedidoRows } = await client.query<{ id: number }>(
      `SELECT id FROM pedido WHERE numero = $1`,
      [numero],
    );
    const pedidoId = pedidoRows[0]?.id;
    if (!pedidoId) throw new Error("Pedido recién creado no encontrado");

    for (const item of items) {
      const row = rows.get(item.menuDiaId)!;
      const unitCents = toCents(row.precio);
      const subtotalCents = lineTotal(unitCents, item.cantidad);
      await client.query(
        `INSERT INTO pedido_detalle (pedido_id, menu_dia_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [pedidoId, item.menuDiaId, item.cantidad, (unitCents / 100).toFixed(2), (subtotalCents / 100).toFixed(2)],
      );
    }

    await client.query(
      `INSERT INTO pago (pedido_id, metodo, monto, registrado_por)
       VALUES ($1, 'efectivo', $2, $3)`,
      [pedidoId, (totalCents / 100).toFixed(2), cajeroId],
    );

    await client.query(
      `INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
       VALUES ($1, NULL, $2, $3)`,
      [pedidoId, pagadoId, cajeroId],
    );

    await client.query("COMMIT");

    return {
      order: {
        id: pedidoId,
        numero,
        tipo: "mostrador",
        estado: "Pagado",
        total: formatCents(totalCents),
      },
      pago: { metodo: "efectivo", monto: formatCents(totalCents) },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** Últimos pedidos de mostrador (deshacer/auditar — contrato sprint 4 #2). */
export async function listRecentCounterOrders(): Promise<RecentCounterOrder[]> {
  const { rows } = await pool.query<{
    id: number;
    numero: string;
    estado: string;
    total: string;
    creado_en: string;
  }>(
    `SELECT p.id, p.numero, ep.nombre AS estado, p.total,
            TO_CHAR(p.creado_en, 'YYYY-MM-DD"T"HH24:MI:SS') AS creado_en
       FROM pedido p
       JOIN estado_pedido ep ON ep.id = p.estado_id
      WHERE p.tipo = 'mostrador'
      ORDER BY p.id DESC
      LIMIT 10`,
  );
  return rows.map((r) => ({
    id: r.id,
    numero: r.numero,
    estado: r.estado,
    total: formatCents(toCents(r.total)),
    creadoEn: r.creado_en,
  }));
}

/**
 * Deshace un pedido de mostrador por error de captura (contrato #3): solo si
 * aún está `Pagado`; si ya avanzó a preparación/entrega se rechaza con 409.
 * La cancelación real la valida `transitionOrder` (transicion_estado).
 */
export async function undoCounterOrder(
  orderId: number,
  actorId: number,
): Promise<{ order: { id: number; estado: string } }> {
  const { rows } = await pool.query<{
    id: number;
    numero: string;
    estado: string;
    tipo: string;
  }>(
    `SELECT p.id, p.numero, ep.nombre AS estado, p.tipo
       FROM pedido p
       JOIN estado_pedido ep ON ep.id = p.estado_id
      WHERE p.id = $1`,
    [orderId],
  );
  const order = rows[0];
  if (!order) throw notFound("Pedido no encontrado");
  if (order.tipo !== "mostrador") {
    throw conflict("Solo se puede deshacer un pedido de mostrador");
  }
  if (order.estado !== "Pagado") {
    throw conflict(`No se puede deshacer: el pedido ya está en "${order.estado}"`);
  }

  const transition = await transitionOrder(orderId, "Cancelado", actorId);
  return { order: transition };
}

export interface ReadyPickupItem {
  nombre: string;
  cantidad: number;
}

export interface ReadyPickupOrder {
  id: number;
  numero: string;
  tipo: string;
  total: string;
  clienteNombre: string | null;
  creadoEn: string;
  fechaRecoleccion: string | null;
  items: ReadyPickupItem[];
}

/**
 * Pedidos `Listo` de ambos orígenes (008 FR-003 — pantalla de Entregas de
 * caja). FIFO por llegada, con partidas, cliente y hora de recolección; el
 * alumno pendiente (sin dueño) muestra `clienteNombre` en null.
 */
export async function listReadyForPickup(): Promise<ReadyPickupOrder[]> {
  const { rows } = await pool.query<{
    id: number;
    numero: string;
    tipo: string;
    total: string;
    cliente_nombre: string | null;
    usuario_nombre: string | null;
    creado_en: string;
    fecha_recoleccion: string | null;
    items: ReadyPickupItem[];
  }>(
    `SELECT p.id, p.numero, p.tipo, p.total, p.cliente_nombre, u.nombre AS usuario_nombre,
            TO_CHAR(p.creado_en, 'YYYY-MM-DD"T"HH24:MI:SS') AS creado_en,
            TO_CHAR(p.fecha_recoleccion, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_recoleccion,
            array_agg(json_build_object('nombre', pl.nombre, 'cantidad', pd.cantidad)
                      ORDER BY pd.id) AS items
       FROM pedido p
       JOIN estado_pedido ep ON ep.id = p.estado_id
       LEFT JOIN usuario u ON u.id = p.usuario_id
       JOIN pedido_detalle pd ON pd.pedido_id = p.id
       JOIN menu_dia md ON md.id = pd.menu_dia_id
       JOIN platillo pl ON pl.id = md.platillo_id
      WHERE ep.nombre = 'Listo'
      GROUP BY p.id, ep.nombre, u.nombre
      ORDER BY p.creado_en ASC`,
  );
  return rows.map((r) => ({
    id: r.id,
    numero: r.numero,
    tipo: r.tipo,
    total: formatCents(toCents(r.total)),
    clienteNombre: r.cliente_nombre ?? r.usuario_nombre ?? null,
    creadoEn: r.creado_en,
    fechaRecoleccion: r.fecha_recoleccion,
    items: r.items ?? [],
  }));
}

/**
 * Listo → Entregado (008 FR-004 — cierre del flujo FR-016 de la spec
 * maestra). La transición la valida `transicion_estado`; cualquier estado
 * distinto de `Listo` responde 409.
 */
export async function deliverOrder(
  orderId: number,
  actorId: number,
): Promise<{ id: number; estado: string }> {
  return transitionOrder(orderId, "Entregado", actorId);
}
