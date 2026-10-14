import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";
import { env } from "../config/env.js";

export const MAX_ATTEMPTS = 3;

export interface NotificationMessage {
  asunto: string;
  cuerpo: string;
}

/**
 * Contenido del aviso (research R4): folio, estado y total únicamente.
 * Nunca platillos, teléfono, datos de pago ni contraseña (reglas §8).
 */
export function render(numero: string, estado: string, total: string): NotificationMessage {
  return {
    asunto: `Tu pedido ${numero} está ${estado}`,
    cuerpo: `Tu pedido ${numero} está ${estado}. Total: $${total}.`,
  };
}

export interface EnqueueInput {
  usuarioId: number;
  pedidoId: number;
  numero: string;
  estado: string;
  total: string;
}

/**
 * Inserta la fila `notificacion` (pendiente) con el cliente de la MISMA
 * transacción que cambió el estado (research R1). Solo se invoca hacia
 * `Listo` con dueño conocido.
 */
export async function createAndEnqueue(client: PoolClient, input: EnqueueInput): Promise<void> {
  const { asunto, cuerpo } = render(input.numero, input.estado, input.total);
  await client.query(
    `INSERT INTO notificacion (usuario_id, pedido_id, tipo, canal, asunto, cuerpo, estado_envio)
     VALUES ($1, $2, 'pedido_listo', 'correo', $3, $4, 'pendiente')`,
    [input.usuarioId, input.pedidoId, asunto, cuerpo],
  );
}

interface PendingRow {
  id: number;
  asunto: string | null;
  cuerpo: string | null;
  intentos: number;
}

/**
 * Flush sandbox (research R2): con NOTIFY_CHANNEL=console escribe cada aviso
 * pendiente en el log de Node y lo marca `enviada`; tras MAX_ATTEMPTS intentos
 * fallidos pasa a `fallida` (FR-030). Canal `smtp` no está implementado en el
 * MVP: no-op honesto sin marcar filas.
 */
export async function flushPending(): Promise<{ enviadas: number; fallidas: number }> {
  if (env.NOTIFY_CHANNEL !== "console") return { enviadas: 0, fallidas: 0 };

  try {
    const { rows } = await pool.query<PendingRow>(
      `SELECT id, asunto, cuerpo, intentos
         FROM notificacion
        WHERE estado_envio = 'pendiente'
        ORDER BY fecha, id
        LIMIT 50`,
    );

    let enviadas = 0;
    let fallidas = 0;

    for (const row of rows) {
      if (row.intentos >= MAX_ATTEMPTS) {
        await pool.query(
          `UPDATE notificacion
              SET estado_envio = 'fallida', detalle_error = $2
            WHERE id = $1 AND estado_envio = 'pendiente'`,
          [row.id, `Se agotaron ${MAX_ATTEMPTS} intentos de envío`],
        );
        fallidas += 1;
        continue;
      }

      console.log(`[notificacion:console] ${row.asunto ?? ""} — ${row.cuerpo ?? ""}`);
      await pool.query(
        `UPDATE notificacion
            SET estado_envio = 'enviada', intentos = intentos + 1
          WHERE id = $1 AND estado_envio = 'pendiente'`,
        [row.id],
      );
      enviadas += 1;
    }

    return { enviadas, fallidas };
  } catch (error) {
    console.error(
      "[notificacion] error en flush:",
      error instanceof Error ? error.message : error,
    );
    return { enviadas: 0, fallidas: 0 };
  }
}
