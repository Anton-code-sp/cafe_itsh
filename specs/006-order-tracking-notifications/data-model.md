# Data Model: Seguimiento y Notificaciones

Uso de la tabla `notificacion` existente + **migración ligera
`migrations/003_notificacion_mensaje.sql`** (el esquema 001 no traía las
columnas de mensaje que exigen el contrato y el quickstart V3) y consultas de
reporte.

## `notificacion` (esquema 001 + migración 003)

| Campo | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| pedido_id | FK → pedido NOT NULL (001) | contexto del aviso |
| usuario_id | FK → usuario (003) | destinatario; NULL en pedidos de mostrador |
| tipo | VARCHAR(30) NOT NULL (001) | ej. `pedido_listo` |
| canal | `correo` \| `push` \| `sms` (001) | MVP: `correo` (sandbox console) |
| asunto | VARCHAR(200) (003) | `Tu pedido {numero} está {estado}` |
| cuerpo | TEXT (003) | folio + estado + total; sin datos sensibles (research R4) |
| estado_envio | `pendiente` \| `enviada` \| `fallida` (001) | flush sandbox marca `enviada` |
| intentos | INTEGER NOT NULL DEFAULT 0 (003) | máx. 3 → `fallida` (FR-030) |
| fecha | TIMESTAMP (001) | creado_en |
| detalle_error | TEXT (001) | motivo de `fallida` |

## Consultas principales

```sql
-- Mis pedidos (dueño) con estado actual
SELECT p.id, p.numero, p.tipo, e.nombre AS estado, p.total,
       p.fecha_recoleccion, p.creado_en
FROM pedido p JOIN estado_pedido e ON e.id = p.estado_id
WHERE p.usuario_id = $1
ORDER BY p.creado_en DESC;

-- Encolar notificación (misma transición — research R1; solo hacia Listo)
INSERT INTO notificacion (usuario_id, pedido_id, tipo, canal, asunto, cuerpo, estado_envio)
VALUES ($1, $2, 'pedido_listo', COALESCE($3,'correo'), $4, $5, 'pendiente');

-- Flush sandbox (dev)
UPDATE notificacion SET estado_envio = 'enviada'
WHERE id = $1 AND estado_envio = 'pendiente';

-- Reporte admin (research R5)
SELECT e.nombre AS estado, p.tipo, COUNT(*) AS pedidos, COALESCE(SUM(p.total),0) AS monto
FROM pedido p JOIN estado_pedido e ON e.id = p.estado_id
WHERE p.creado_en BETWEEN $1 AND $2
GROUP BY e.nombre, p.tipo
ORDER BY e.nombre, p.tipo;
```

## Estados para el badge (consistencia UI)

`Pendiente` (amarillo), `Pagado` (azul), `En preparación` (naranja),
`Listo` (verde), `Entregado` (gris-verde), `Cancelado` (rojo) — siempre con
**texto + color** (reglas §19).

## Integridad

- Notificación creada en la MISMA transacción que el cambio de estado.
- Solo se encola hacia **`Listo`** y solo si `pedido.usuario_id IS NOT NULL`
  (pedidos de mostrador no tienen destinatario — SC-001 solo exige el aviso de
  pedido listo).
- `intentos >= 3` → `fallida`; no reintento automático en MVP.
- Nunca incluir en `cuerpo`: datos de pago, teléfono, contraseña.
