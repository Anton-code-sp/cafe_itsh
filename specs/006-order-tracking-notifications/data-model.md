# Data Model: Seguimiento y Notificaciones

Sin migraciones nuevas. Uso de `notificacion` (existente) y consultas de
reporte.

## `notificacion` (existente)

| Campo | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| usuario_id | FK → usuario NOT NULL | destinatario |
| pedido_id | FK → pedido | contexto del aviso |
| canal | `correo` \| `push` \| `sms` | MVP: `correo` (sandbox console) |
| asunto | VARCHAR | `Tu pedido {numero} está {estado}` |
| cuerpo | TEXT | folio + estado + total; sin datos sensibles (research R4) |
| estado_envio | `pendiente` \| `enviada` \| `fallida` | flush sandbox marca `enviada` |
| intentos | INTEGER | máx. 3 → `fallida` (FR-030) |
| creado_en | TIMESTAMP | |

## Consultas principales

```sql
-- Mis pedidos (dueño) con estado actual
SELECT p.id, p.numero, p.tipo, e.nombre AS estado, p.total,
       p.fecha_recoleccion, p.creado_en
FROM pedido p JOIN estado_pedido e ON e.id = p.estado_id
WHERE p.usuario_id = $1
ORDER BY p.creado_en DESC;

-- Encolar notificación (misma transición — research R1)
INSERT INTO notificacion (usuario_id, pedido_id, canal, asunto, cuerpo, estado_envio)
VALUES ($1, $2, COALESCE($3,'correo'), $4, $5, 'pendiente');

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
- `intentos >= 3` → `fallida`; no reintento automático en MVP.
- Nunca incluir en `cuerpo`: datos de pago, teléfono, contraseña.
