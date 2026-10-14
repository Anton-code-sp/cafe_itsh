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
  clienteNombre: string | null;
  creadoEn: string;
  /** Solo anticipados: hora comprometida de recolección (HH:MM). */
  horaRecoleccion: string | null;
  minutosEspera: number;
  items: KitchenOrderItem[];
}

/**
 * Cola de cocina (data-model.md — research R4): una sola lista FIFO con los
 * pedidos `Pagado` y `En preparación` (el alumno no aparece: su pedido nace
 * en `Pendiente`), tipos mixtos y minutos de espera calculados desde
 * `creado_en`. Incluye cliente y hora de recolección (008 — tarjeta KDS).
 */
export async function getKitchenQueue(): Promise<KitchenOrder[]> {
  const { rows } = await pool.query<{
    id: number;
    numero: string;
    tipo: string;
    estado: string;
    cliente_nombre: string | null;
    creado_en: string;
    hora_recoleccion: string | null;
    items: KitchenOrderItem[];
  }>(
    `SELECT p.id, p.numero, p.tipo, e.nombre AS estado,
            COALESCE(p.cliente_nombre, u.nombre) AS cliente_nombre,
            TO_CHAR(p.creado_en, 'YYYY-MM-DD"T"HH24:MI:SS') AS creado_en,
            CASE WHEN p.tipo = 'anticipado'
                 THEN TO_CHAR(p.fecha_recoleccion, 'HH24:MI') END AS hora_recoleccion,
            array_agg(json_build_object('nombre', pl.nombre, 'cantidad', pd.cantidad)
                      ORDER BY pd.id) AS items
       FROM pedido p
       JOIN estado_pedido e ON e.id = p.estado_id
       LEFT JOIN usuario u ON u.id = p.usuario_id
       JOIN pedido_detalle pd ON pd.pedido_id = p.id
       JOIN menu_dia md ON md.id = pd.menu_dia_id
       JOIN platillo pl ON pl.id = md.platillo_id
      WHERE e.nombre IN ('Pagado', 'En preparación')
      GROUP BY p.id, e.nombre, u.nombre
      ORDER BY p.creado_en ASC`,
  );

  const now = Date.now();
  return rows.map((r) => ({
    id: r.id,
    numero: r.numero,
    tipo: r.tipo,
    estado: r.estado,
    clienteNombre: r.cliente_nombre ?? null,
    creadoEn: r.creado_en,
    horaRecoleccion: r.hora_recoleccion ?? null,
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
