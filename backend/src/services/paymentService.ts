import { randomBytes } from "crypto";
import { pool } from "../db/pool.js";
import { conflict, notFound } from "../errors.js";
import { formatCents } from "../utils/money.js";

/**
 * Capa de pago con adaptador sandbox (research R3). En desarrollo el
 * adaptador aprueba siempre y devuelve una referencia ficticia; la interfaz
 * aísla al resto del código del proveedor real (Stripe/mercadoPago).
 */

export interface PaymentIntent {
  reference: string;
  status: "pending";
}

export interface PaymentConfirmation {
  order: { id: number; numero: string; estado: string; total: string };
  pago: { referencia: string; monto: string };
}

export async function createPayment(_orderId: number, _amountCents: number): Promise<PaymentIntent> {
  // Sandbox: siempre "aprobable" con referencia ficticia. El proveedor real
  // reemplazará esta función sin tocar el resto del flujo del pedido.
  return {
    reference: `pay_sandbox_${randomBytes(6).toString("hex")}`,
    status: "pending",
  };
}

export async function confirmPayment(orderId: number): Promise<PaymentConfirmation> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: orderRows } = await client.query<{
      id: number;
      numero: string;
      estado: string;
      total: string;
      estado_id: number;
    }>(
      `SELECT p.id, p.numero, p.total, ep.id AS estado_id, ep.nombre AS estado
         FROM pedido p
         JOIN estado_pedido ep ON ep.id = p.estado_id
        WHERE p.id = $1
        FOR UPDATE`,
      [orderId],
    );
    const order = orderRows[0];
    if (!order) throw notFound("Pedido no encontrado");
    if (order.estado !== "Pendiente") {
      throw conflict(`El pedido ya no está pendiente de pago (estado: ${order.estado})`);
    }

    const { rows: pagadoRows } = await client.query<{ id: number }>(
      `SELECT id FROM estado_pedido WHERE nombre = 'Pagado'`,
    );
    const pagadoId = pagadoRows[0]?.id;
    if (!pagadoId) throw new Error("Estado 'Pagado' no sembrado en la base de datos");

    const { rows: transitionRows } = await client.query(
      `SELECT 1 FROM transicion_estado WHERE desde_id = $1 AND hacia_id = $2`,
      [order.estado_id, pagadoId],
    );
    if (!transitionRows[0]) {
      throw conflict("Transición de estado no permitida");
    }

    const totalCents = Math.round(Number(order.total) * 100);
    const referencia = `pay_sandbox_${randomBytes(6).toString("hex")}`;

    const { rowCount: pagoInserted } = await client.query(
      `INSERT INTO pago (pedido_id, metodo, monto, referencia)
       VALUES ($1, 'online', $2, $3)`,
      [orderId, (totalCents / 100).toFixed(2), referencia],
    );
    if (pagoInserted === 0) throw conflict("No se pudo registrar el pago");

    const { rowCount: updated } = await client.query(
      `UPDATE pedido SET estado_id = $1 WHERE id = $2`,
      [pagadoId, orderId],
    );
    if (updated === 0) throw conflict("No se pudo actualizar el pedido");

    await client.query(
      `INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id)
       VALUES ($1, $2, $3)`,
      [orderId, order.estado_id, pagadoId],
    );

    await client.query("COMMIT");

    return {
      order: {
        id: order.id,
        numero: order.numero,
        estado: "Pagado",
        total: formatCents(totalCents),
      },
      pago: { referencia, monto: formatCents(totalCents) },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
