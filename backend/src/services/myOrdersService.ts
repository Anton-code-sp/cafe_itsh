import { pool } from "../db/pool.js";
import { forbidden, notFound } from "../errors.js";

/**
 * US1 (006): seguimiento "Mis pedidos". Solo los pedidos con `usuario_id`
 * conocido (los de mostrador no tienen dueño y no se listan aquí).
 */

export interface MyOrderSummary {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  total: string;
  creadoEn: string;
  fechaRecoleccion: string | null;
}

export async function listMine(userId: number): Promise<{ orders: MyOrderSummary[] }> {
  const { rows } = await pool.query<MyOrderSummary>(
    `SELECT p.id, p.numero, p.tipo, ep.nombre AS estado, p.total,
            p.creado_en AS "creadoEn", p.fecha_recoleccion AS "fechaRecoleccion"
       FROM pedido p
       JOIN estado_pedido ep ON ep.id = p.estado_id
      WHERE p.usuario_id = $1
      ORDER BY p.creado_en DESC, p.id DESC`,
    [userId],
  );
  return { orders: rows };
}

interface OrderRow {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  total: string;
  usuario_id: number | null;
}

async function loadOwned(orderId: number, userId: number): Promise<OrderRow> {
  const { rows } = await pool.query<OrderRow>(
    `SELECT p.id, p.numero, p.tipo, ep.nombre AS estado, p.total, p.usuario_id
       FROM pedido p
       JOIN estado_pedido ep ON ep.id = p.estado_id
      WHERE p.id = $1`,
    [orderId],
  );
  const order = rows[0];
  if (!order) throw notFound("Pedido no encontrado");
  if (order.usuario_id !== userId) {
    throw forbidden("No tienes permiso para ver este pedido");
  }
  return order;
}

export interface MyOrderItem {
  nombre: string;
  cantidad: number;
  subtotal: string;
}

export interface HistoryEntry {
  estado: string;
  en: string;
}

export async function getMine(
  orderId: number,
  userId: number,
): Promise<{
  order: { id: number; numero: string; tipo: string; estado: string; total: string };
  items: MyOrderItem[];
  historial: HistoryEntry[];
}> {
  const order = await loadOwned(orderId, userId);

  const { rows: items } = await pool.query<MyOrderItem>(
    `SELECT pl.nombre, pd.cantidad, pd.subtotal
       FROM pedido_detalle pd
       JOIN menu_dia md ON md.id = pd.menu_dia_id
       JOIN platillo pl ON pl.id = md.platillo_id
      WHERE pd.pedido_id = $1
      ORDER BY pd.id`,
    [orderId],
  );

  const { rows: historial } = await pool.query<HistoryEntry>(
    `SELECT ep.nombre AS estado, h.fecha AS "en"
       FROM pedido_estado_historial h
       JOIN estado_pedido ep ON ep.id = h.estado_nuevo_id
      WHERE h.pedido_id = $1
      ORDER BY h.fecha, h.id`,
    [orderId],
  );

  return {
    order: {
      id: order.id,
      numero: order.numero,
      tipo: order.tipo,
      estado: order.estado,
      total: order.total,
    },
    items,
    historial,
  };
}

export interface NotificationSummary {
  canal: string;
  asunto: string | null;
  estadoEnvio: string;
  creadoEn: string;
}

/** Auditoría demo de los avisos de un pedido (dueño). */
export async function getNotificationsForOrder(
  orderId: number,
  userId: number,
): Promise<{ notifications: NotificationSummary[] }> {
  await loadOwned(orderId, userId);

  const { rows } = await pool.query<NotificationSummary>(
    `SELECT n.canal, n.asunto, n.estado_envio AS "estadoEnvio", n.fecha AS "creadoEn"
       FROM notificacion n
      WHERE n.pedido_id = $1
      ORDER BY n.fecha, n.id`,
    [orderId],
  );
  return { notifications: rows };
}
