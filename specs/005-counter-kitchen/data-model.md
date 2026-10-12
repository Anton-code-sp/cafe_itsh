# Data Model: Mostrador (Cajero) y Cocina

Tablas existentes (sin migraciones nuevas). Este sprint **no crea entidades**;
expande el uso de las existentes.

## Estados y transiciones (completos)

```text
Pendiente ──▶ Pagado ──▶ En preparación ──▶ Listo ──▶ Entregado
     │            │              │
     └────────────┴──────────────┘──▶ Cancelado
```

Seed existente: TODAS estas transiciones incluyen `Pagado→En preparación`,
`En preparación→Listo`, `Listo→Entregado` y las cancelaciones permitidas.

## Tipos de pedido en este sprint

| tipo | creador | estado inicial | usuario_id | pago |
|---|---|---|---|---|
| `anticipado` | alumno (sprint 3) | `Pendiente` | requerido | online sandbox |
| `mostrador` | cajero | `Pagado` | NULL (cliente nombre opcional) | `efectivo` (registrado por cajero) |

CHECK existente: `mostrador` exige `cliente_nombre` o permite NULL según
esquema — verificar al implementar; si exige nombre, pedir nombre o usar
"N/A".

## Consultas principales

```sql
-- Crear pedido de mostrador (transacción, research R2)
INSERT INTO pedido (numero, tipo, estado_id, cliente_nombre, fecha_recoleccion, total)
VALUES ($1, 'mostrador', (SELECT id FROM estado_pedido WHERE nombre='Pagado'), $2, NOW(), $3)
RETURNING id;

INSERT INTO pedido_detalle (...) ...;  -- igual que sprint 3
INSERT INTO pago (pedido_id, metodo, monto, registrado_por)
VALUES ($1, 'efectivo', $3, $5);
INSERT INTO pedido_estado_historial (pedido_id, estado_nuevo_id, cambiado_por)
VALUES ($1, (SELECT id FROM estado_pedido WHERE nombre='Pagado'), $5);

-- Transición (única puerta — research R1)
-- 1) SELECT valido FROM transicion_estado WHERE desde=$1 AND hacia=$2
-- 2) si no existe → 409
-- 3) UPDATE pedido SET estado_id=$2 WHERE id=$3
-- 4) INSERT pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
--    con estado_anterior_id = estado actual previo al UPDATE (en la misma transacción)

-- Cola de cocina (FIFO — research R4)
SELECT p.id, p.numero, p.tipo, p.creado_en, e.nombre AS estado,
       array_agg(json_build_object('nombre', pl.nombre, 'cantidad', pd.cantidad) ORDER BY pd.id) AS items
FROM pedido p
JOIN estado_pedido e ON e.id = p.estado_id
JOIN pedido_detalle pd ON pd.pedido_id = p.id
JOIN menu_dia md ON md.id = pd.menu_dia_id
JOIN platillo pl ON pl.id = md.platillo_id
WHERE e.nombre IN ('Pagado', 'En preparación')
GROUP BY p.id, e.nombre
ORDER BY p.creado_en ASC;

-- Historial de un pedido
SELECT estado_anterior_id, estado_nuevo_id, cambiado_en, cambiado_por
FROM pedido_estado_historial WHERE pedido_id = $1 ORDER BY cambiado_en;
```

## Impacto en migraciones

**Ninguno.** El CHECK de `pedido` permite `mostrador` con `usuario_id`,
`cliente_nombre` y `fecha_recoleccion` en NULL. `pago` solo tiene `monto` y
`metodo`: el **cambio** se calcula en el frontend (montoRecibido − total) y
no se persiste.

## Integridad

- Una sola función del servidor puede cambiar `estado_id` (evita saltos).
- `pedido_estado_historial` siempre se inserta junto al UPDATE.
- El total del mostrador se calcula igual que el anticipado (precios
  congelados del menú del día).
