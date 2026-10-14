# Contracts: Seguimiento y Notificaciones

Convenciones iguales a `specs/002-foundation-auth/contracts/api.md`.

## Endpoints

| # | Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|---|
| 1 | GET | `/my-orders` | autenticado | Lista de pedidos del dueño con estado |
| 2 | GET | `/my-orders/:id` | dueño | Detalle + historial resumido |
| 3 | GET | `/admin/reports/sales?desde&hasta` | administrador | Agregados por estado/tipo |
| 4 | GET | `/my-orders/:id/notifications` | dueño | Avisos de ese pedido (auditoría demo) |

## 1. GET `/my-orders`

**Respuesta 200**:
```json
{
  "orders": [
    { "id": 9, "numero": "PED-20261110-0001", "tipo": "anticipado", "estado": "Listo", "total": "90.00", "creadoEn": "2026-11-10T12:20:00", "fechaRecoleccion": "2026-11-10T13:00:00" }
  ]
}
```

## 2. GET `/my-orders/:id`

**Respuesta 200**: pedido + detalle + últimos estados:
```json
{
  "order": { "id": 9, "numero": "PED-20261110-0001", "estado": "Listo", "total": "90.00" },
  "items": [ { "nombre": "Gordita de chicharrón", "cantidad": 2, "subtotal": "70.00" } ],
  "historial": [ { "estado": "Pagado", "en": "2026-11-10T12:21:00" }, { "estado": "En preparación", "en": "2026-11-10T12:30:00" }, { "estado": "Listo", "en": "2026-11-10T12:35:00" } ]
}
```
**Errores**: `401` · `403` (no dueño) · `404`.

## 3. GET `/admin/reports/sales?desde=2026-11-01&hasta=2026-11-30`

**Respuesta 200**:
```json
{
  "rango": { "desde": "2026-11-01", "hasta": "2026-11-30" },
  "resumen": { "pedidos": 120, "monto": "10540.00" },
  "porEstado": [ { "estado": "Entregado", "pedidos": 80, "monto": "7000.00" }, { "estado": "Cancelado", "pedidos": 5, "monto": "420.00" } ],
  "porTipo": [ { "tipo": "anticipado", "pedidos": 90, "monto": "8100.00" }, { "tipo": "mostrador", "pedidos": 30, "monto": "2440.00" } ]
}
```
**Errores**: `403` (no admin) · `400` (rango inválido).

## 4. GET `/my-orders/:id/notifications`

```json
{ "notifications": [ { "canal": "correo", "asunto": "Tu pedido PED-20261110-0001 está Listo", "estadoEnvio": "enviada", "creadoEn": "2026-11-10T12:35:01" } ] }
```

## Contrato de UI

| Ruta | Pantalla |
|---|---|
| `/mis-pedidos` | Lista con `OrderStatusBadge` + polling 15 s + focus |
| `/mis-pedidos/:id` | Detalle con historial |
| `/admin/reportes` | Tabla de agregados (solo admin) |

**Flujo de notificación** (interno): `transitionOrder` → (solo hacia `Listo`
y con `usuario_id`) inserta `notificacion` (pendiente) →
`notificationService.flush` (console) marca `enviada` y loguea asunto/cuerpo.
