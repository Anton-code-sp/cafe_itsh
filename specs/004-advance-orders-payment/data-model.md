# Data Model: Pedido Anticipado y Pago

Tablas existentes (sin migraciones nuevas): `pedido`, `pedido_detalle`,
`pago`, `estado_pedido`, `transicion_estado`, `pedido_estado_historial`.

## Entidades

### `pedido` (existente)

| Campo | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| numero | VARCHAR(20) UNIQUE | folio `PED-YYYYMMDD-XXXX` (research R5) |
| tipo | `anticipado` \| `mostrador` | en este sprint solo `anticipado` |
| estado_id | FK → estado_pedido | inicia en `Pendiente` |
| usuario_id | FK → usuario NOT NULL (anticipado) | dueño |
| cliente_nombre | VARCHAR(100) | solo mostrador (sprint 4) |
| fecha_recoleccion | TIMESTAMP NOT NULL (anticipado) | hora de corte del día |
| total | NUMERIC(10,2) ≥ 0 | calculado en servidor |
| creado_por / creado_en / actualizado_en | | trigger existe |

CHECK del esquema: anticipado exige `usuario_id` y `fecha_recoleccion`.

### `pedido_detalle` (existente)

| Campo | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| pedido_id | FK → pedido ON DELETE CASCADE | |
| menu_dia_id | FK → menu_dia | platillo+precio del menú |
| cantidad | INTEGER > 0 | |
| precio_unitario | NUMERIC ≥ 0 | congelado del menú |
| subtotal | NUMERIC ≥ 0 | cantidad × precio_unitario |

### `pago` (existente)

| Campo | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| pedido_id | FK → pedido UNIQUE | **uno por pedido** |
| metodo | `online` \| `efectivo` | este sprint: `online` |
| monto | NUMERIC > 0 | igual a `pedido.total` |
| referencia | VARCHAR(100) | id en la pasarela; **sin datos de tarjeta** |
| registrado_por | FK → usuario | |
| fecha | TIMESTAMP | |

### Estados usados (seed existente)

`Pendiente(1)`, `Pagado(2)`, `Cancelado(0)`; transiciones válidas de este
sprint: `Pendiente → Pagado`, `Pendiente → Cancelado`.

## Consultas principales

```sql
-- Verificar ventana de 10 minutos (research R1)
-- (fecha de hoy + CUTOFF_TIME) - NOW() >= 10 minutes

-- Folio del día
SELECT COUNT(*) + 1 FROM pedido WHERE creado_en::date = CURRENT_DATE;

-- Crear pedido (en transacción con detalles)
INSERT INTO pedido (numero, tipo, estado_id, usuario_id, fecha_recoleccion, total)
VALUES ($1, 'anticipado', (SELECT id FROM estado_pedido WHERE nombre='Pendiente'),
        $2, $3, $4) RETURNING id;

INSERT INTO pedido_detalle (pedido_id, menu_dia_id, cantidad, precio_unitario, subtotal)
SELECT $1, md.id, d.cantidad, md.precio, d.cantidad * md.precio
FROM unnest($2::int[], $3::int[]) AS d(menu_dia_id, cantidad)
JOIN menu_dia md ON md.id = d.menu_dia_id AND md.fecha = CURRENT_DATE;

-- Preview del total (antes de crear)
SELECT md.id, p.nombre, md.precio, md.disponible,
       md.precio * $2 AS subtotal
FROM menu_dia md JOIN platillo p ON p.id = md.platillo_id
WHERE md.id = ANY($1) AND md.disponible AND p.activo;

-- Confirmar pago (transacción)
INSERT INTO pago (pedido_id, metodo, monto, referencia)
VALUES ($1, 'online', $2, $3);
UPDATE pedido SET estado_id = (SELECT id FROM estado_pedido WHERE nombre='Pagado')
WHERE id = $1 AND estado_id = (SELECT id FROM estado_pedido WHERE nombre='Pendiente');
INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
VALUES ($1, (SELECT id FROM estado_pedido WHERE nombre='Pendiente'),
        (SELECT id FROM estado_pedido WHERE nombre='Pagado'), $4);

-- Mis pedidos (detalle mínimo para la confirmación)
SELECT p.numero, p.total, e.nombre AS estado, p.creado_en
FROM pedido p JOIN estado_pedido e ON e.id = p.estado_id
WHERE p.usuario_id = $1 ORDER BY p.creado_en DESC;
```

## Estados y transiciones (este sprint)

```text
Pendiente ──pago confirmado──▶ Pagado
    │                              │
    └────── cancelación ───────────┘──▶ Cancelado
```

Cualquier otra transición → rechazo 409/400 (FR-003: sin saltos).

## Impacto en migraciones

**Ninguno.** Todas las tablas y el seed de estados/transiciones existen.

## Integridad

- `pago.pedido_id UNIQUE` → un solo pago por pedido.
- `CHECK (total >= 0)`, `CHECK (cantidad > 0)` a nivel de BD.
- Importes en `NUMERIC(10,2)`: parsear con `parseFloat` solo en display;
  calcular en servidor con enteros de centavos o `pg` numérico (ver `utils/money.ts`).
