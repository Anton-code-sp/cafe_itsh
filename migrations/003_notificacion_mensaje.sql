-- ============================================================
-- Migración 003 — Sprint 5 (specs/006-order-tracking-notifications)
-- El contrato de notificaciones necesita asunto/cuerpo/intentos y el
-- destinatario directo; la tabla `notificacion` del esquema 001 solo
-- tenía pedido_id/tipo/canal/estado_envio/fecha/detalle_error.
-- ============================================================

ALTER TABLE notificacion
  ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuario(id),
  ADD COLUMN IF NOT EXISTS asunto      VARCHAR(200),
  ADD COLUMN IF NOT EXISTS cuerpo      TEXT,
  ADD COLUMN IF NOT EXISTS intentos    INTEGER NOT NULL DEFAULT 0;

-- Backfill: destinatario derivado del pedido (si existieran filas previas)
UPDATE notificacion n
   SET usuario_id = p.usuario_id
  FROM pedido p
 WHERE p.id = n.pedido_id
   AND n.usuario_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_notificacion_pedido ON notificacion (pedido_id);
CREATE INDEX IF NOT EXISTS idx_notificacion_estado ON notificacion (estado_envio);
