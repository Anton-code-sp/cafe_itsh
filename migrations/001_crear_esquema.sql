-- ============================================================
-- 001_crear_esquema.sql
-- Esquema de la base de datos para el Sistema de Pedidos
-- Anticipados — Cafetería ITSH (PostgreSQL 18)
-- Ejecutar en orden: 001_crear_esquema.sql, luego 002_seed_inicial.sql
-- ============================================================

-- ------------------------------------------------------------
-- Catálogo de roles
-- ------------------------------------------------------------
CREATE TABLE rol (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(30) NOT NULL UNIQUE,
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Usuarios del sistema
-- ------------------------------------------------------------
CREATE TABLE usuario (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  correo        VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  rol_id        INTEGER NOT NULL REFERENCES rol(id),
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Catálogo de platillos (historial permanente)
-- ------------------------------------------------------------
CREATE TABLE platillo (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  categoria   VARCHAR(50),
  descripcion TEXT,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Menú del día: asocia platillos a una fecha con precio y
-- disponibilidad. El precio se congela al agregarlo al menú
-- para mantener historial. Un platillo solo puede aparecer
-- una vez por fecha.
-- ------------------------------------------------------------
CREATE TABLE menu_dia (
  id          SERIAL PRIMARY KEY,
  fecha       DATE NOT NULL,
  platillo_id INTEGER NOT NULL REFERENCES platillo(id),
  precio      NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  disponible  BOOLEAN NOT NULL DEFAULT TRUE,
  especial    BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (fecha, platillo_id)
);

-- ------------------------------------------------------------
-- Catálogo de estados de pedido
-- ------------------------------------------------------------
CREATE TABLE estado_pedido (
  id      SERIAL PRIMARY KEY,
  nombre  VARCHAR(30) NOT NULL UNIQUE,
  orden   INTEGER NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- Transiciones válidas entre estados (validación por datos)
-- ------------------------------------------------------------
CREATE TABLE transicion_estado (
  desde_id INTEGER NOT NULL REFERENCES estado_pedido(id),
  hacia_id INTEGER NOT NULL REFERENCES estado_pedido(id),
  PRIMARY KEY (desde_id, hacia_id),
  CHECK (desde_id <> hacia_id)
);

-- ------------------------------------------------------------
-- Pedidos: anticipados (usuario + fecha de recolección) y
-- de mostrador (cliente nombre, opcional). El estado actual
-- siempre vive aquí; el historial queda en su tabla propia.
-- ------------------------------------------------------------
CREATE TABLE pedido (
  id                SERIAL PRIMARY KEY,
  numero            VARCHAR(20) NOT NULL UNIQUE,
  tipo              VARCHAR(20) NOT NULL CHECK (tipo IN ('anticipado', 'mostrador')),
  estado_id         INTEGER NOT NULL REFERENCES estado_pedido(id),
  usuario_id        INTEGER REFERENCES usuario(id),
  cliente_nombre    VARCHAR(100),
  fecha_recoleccion TIMESTAMP,
  total             NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  creado_por        INTEGER REFERENCES usuario(id),
  creado_en         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (tipo = 'anticipado' AND usuario_id IS NOT NULL AND fecha_recoleccion IS NOT NULL)
    OR (tipo = 'mostrador')
  )
);

-- ------------------------------------------------------------
-- Detalle de pedidos: platillo del menú, cantidad y precio
-- unitario congelado al momento de crear el pedido.
-- ------------------------------------------------------------
CREATE TABLE pedido_detalle (
  id              SERIAL PRIMARY KEY,
  pedido_id       INTEGER NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  menu_dia_id     INTEGER NOT NULL REFERENCES menu_dia(id),
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal        NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0)
);

-- ------------------------------------------------------------
-- Historial de cambios de estado de cada pedido
-- ------------------------------------------------------------
CREATE TABLE pedido_estado_historial (
  id                SERIAL PRIMARY KEY,
  pedido_id         INTEGER NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  estado_anterior_id INTEGER REFERENCES estado_pedido(id),
  estado_nuevo_id   INTEGER NOT NULL REFERENCES estado_pedido(id),
  cambiado_por      INTEGER REFERENCES usuario(id),
  fecha             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Pagos: uno por pedido, monto completo. Sin datos de tarjeta.
-- referencia identifica la transacción en la pasarela externa.
-- ------------------------------------------------------------
CREATE TABLE pago (
  id              SERIAL PRIMARY KEY,
  pedido_id       INTEGER NOT NULL UNIQUE REFERENCES pedido(id),
  metodo          VARCHAR(20) NOT NULL CHECK (metodo IN ('online', 'efectivo')),
  monto           NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  referencia      VARCHAR(100),
  registrado_por  INTEGER REFERENCES usuario(id),
  fecha           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Notificaciones de pedido listo (separadas de la lógica
-- principal de pedidos; soportan reintento y auditoría)
-- ------------------------------------------------------------
CREATE TABLE notificacion (
  id            SERIAL PRIMARY KEY,
  pedido_id     INTEGER NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  tipo          VARCHAR(30) NOT NULL,
  canal         VARCHAR(20) NOT NULL CHECK (canal IN ('correo', 'push', 'sms')),
  estado_envio  VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                  CHECK (estado_envio IN ('pendiente', 'enviada', 'fallida')),
  fecha         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  detalle_error TEXT
);

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX idx_usuario_rol ON usuario(rol_id);
CREATE INDEX idx_menu_dia_fecha ON menu_dia(fecha);
CREATE INDEX idx_pedido_estado ON pedido(estado_id);
CREATE INDEX idx_pedido_fecha_recoleccion ON pedido(fecha_recoleccion);
CREATE INDEX idx_pedido_usuario ON pedido(usuario_id);
CREATE INDEX idx_pedido_tipo ON pedido(tipo);
CREATE INDEX idx_pedido_detalle_pedido ON pedido_detalle(pedido_id);
CREATE INDEX idx_historial_pedido ON pedido_estado_historial(pedido_id);
CREATE INDEX idx_pago_pedido ON pago(pedido_id);
CREATE INDEX idx_notificacion_pendiente
  ON notificacion(estado_envio) WHERE estado_envio = 'pendiente';

-- ============================================================
-- Trigger: mantener actualizado_en al actualizar
-- ============================================================
CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuario_actualizado
  BEFORE UPDATE ON usuario
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE TRIGGER trg_platillo_actualizado
  BEFORE UPDATE ON platillo
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE TRIGGER trg_pedido_actualizado
  BEFORE UPDATE ON pedido
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();
