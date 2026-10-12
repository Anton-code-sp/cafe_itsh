# Contracts: Pedido Anticipado y Pago

Convenciones iguales a `specs/002-foundation-auth/contracts/api.md`.

## Endpoints

| # | Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|---|
| 1 | GET | `/orders/quote?items=…` | autenticado | Preview del total (opcional) |
| 2 | POST | `/orders` | autenticado (alumno/docente) | Crear pedido anticipado (Pendiente) |
| 3 | GET | `/orders/:id` | dueño o admin | Detalle/folio del pedido |
| 4 | POST | `/orders/:id/cancel` | dueño | Cancelar si está Pendiente |
| 5 | POST | `/payments/:orderId/confirm` | dueño | Confirmar pago → Pagado |

## 1. GET `/orders/quote?items=42:2,45:1`

Query `items` = `menuDiaId:cantidad` (preview). Devuelve subtotal por item y
total, o error si algún item no está disponible.

**Respuesta 200**:
```json
{
  "items": [ { "menuDiaId": 42, "nombre": "Gordita de chicharrón", "cantidad": 2, "precio": "35.00", "subtotal": "70.00" } ],
  "total": "70.00",
  "canOrder": true,
  "reason": null
}
```
`canOrder:false, reason:"El pedido debe hacerse con al menos 10 minutos de anticipación"` cuando la ventana falla.

## 2. POST `/orders`

**Request**:
```json
{
  "items": [ { "menuDiaId": 42, "cantidad": 2 }, { "menuDiaId": 45, "cantidad": 1 } ]
}
```

**Respuesta 201**:
```json
{
  "order": { "id": 9, "numero": "PED-20261110-0001", "estado": "Pendiente", "total": "90.00", "fechaRecoleccion": "2026-11-10T13:00:00" },
  "payment": { "reference": "pay_sandbox_abc123", "status": "pending" }
}
```

**Errores**:
- `400` items vacíos/cantidad ≤ 0/datos inválidos
- `409` ventana < 10 min → mensaje claro (FR-003)
- `409` platillo no disponible en el menú de hoy (FR-004)
- `401` sin sesión

## 3. GET `/orders/:id`

**Respuesta 200**: pedido con detalle:
```json
{
  "id": 9, "numero": "PED-20261110-0001", "estado": "Pendiente", "total": "90.00",
  "items": [ { "nombre": "Gordita de chicharrón", "cantidad": 2, "precioUnitario": "35.00", "subtotal": "70.00" } ],
  "pago": null
}
```
**Errores**: `401` · `403` (no es el dueño) · `404`.

## 4. POST `/orders/:id/cancel`

**Respuesta 200**: pedido en estado `Cancelado`.
**Errores**: `409` si el estado no lo permite (ya `En preparación`,
`Entregado` o `Cancelado` — la política completa con `Listo` es del sprint 4;
`Pendiente` y `Pagado` sí son cancelables, según el seed de transiciones).

## 5. POST `/payments/:orderId/confirm`

Confirmación del pago (en sandbox: siempre aprueba; en producción: la llama
la pasarela o el frontend tras el redirect).

**Respuesta 200**:
```json
{ "order": { "id": 9, "numero": "PED-20261110-0001", "estado": "Pagado", "total": "90.00" }, "pago": { "referencia": "pay_sandbox_abc123", "monto": "90.00" } }
```
**Errores**: `409` si el pedido ya no está `Pendiente` · `404`.

## Contrato de UI

| Ruta | Pantalla |
|---|---|
| `/menu` | cantidades por platillo + botón "Ver pedido" (nuevo) |
| `/cart` | resumen con total, aviso de ventana, botón "Pagar" |
| `/checkout` | form sandbox de pago (sin datos reales de tarjeta) |
| `/orders/:id` (o `/mis-pedidos/:id`) | confirmación con folio + estado |

Flujo: `/menu` → `/cart` → `POST /orders` → `/checkout` →
`POST /payments/:id/confirm` → confirmación con folio `Pagado`.
