import { pool } from "../db/pool.js";
import { transitionOrder } from "./orderService.js";

export interface KitchenOrderItem {
  nombre: string;
  cantidad: number;
}

export interface KitchenOrder {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  creadoEn: string;
  minutosEspera: number;
  items: KitchenOrderItem[];
}

/**
 * Cola de cocina (data-model.md — research R4): una sola lista FIFO con los
 * pedidos `Pagado` y `En preparación` (el alumno no aparece: su pedido nace
 * en `Pendiente`), tipos mixtos y minutos de espera calculados desde
 * `creado_en`.
 */
export async function getKitchenQueue(): Promise<KitchenOrder[]> {
  const { rows } = await pool.query<{
    id: number;
    numero: string;
    tipo: string;
    estado: string;
    creado_en: string;
    items: KitchenOrderItem[];
  }>(
    `SELECT p.id, p.numero, p.tipo, e.nombre AS estado,
            TO_CHAR(p.creado_en, 'YYYY-MM-DD"T"HH24:MI:SS') AS creado_en,
            array_agg(json_build_object('nombre', pl.nombre, 'cantidad', pd.cantidad)
                      ORDER BY pd.id) AS items
       FROM pedido p
       JOIN estado_pedido e ON e.id = p.estado_id
       JOIN pedido_detalle pd ON pd.pedido_id = p.id
       JOIN menu_dia md ON md.id = pd.menu_dia_id
       JOIN platillo pl ON pl.id = md.platillo_id
      WHERE e.nombre IN ('Pagado', 'En preparación')
      GROUP BY p.id, e.nombre
      ORDER BY p.creado_en ASC`,
  );

  const now = Date.now();
  return rows.map((r) => ({
    id: r.id,
    numero: r.numero,
    tipo: r.tipo,
    estado: r.estado,
    creadoEn: r.creado_en,
    minutosEspera: Math.max(
      0,
      Math.floor((now - new Date(r.creado_en).getTime()) / 60_000),
    ),
    items: r.items ?? [],
  }));
}

/** Pagado → En preparación (transición validada por `transicion_estado`). */
export async function startOrder(
  orderId: number,
  actorId: number,
): Promise<{ id: number; estado: string }> {
  return transitionOrder(orderId, "En preparación", actorId);
}

/** En preparación → Listo (transición validada por `transicion_estado`). */
export async function readyOrder(
  orderId: number,
  actorId: number,
): Promise<{ id: number; estado: string }> {
  return transitionOrder(orderId, "Listo", actorId);
}
