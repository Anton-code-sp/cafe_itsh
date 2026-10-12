# Contracts: Mostrador (Cajero) y Cocina

Convenciones iguales a `specs/002-foundation-auth/contracts/api.md`.

## Endpoints

| # | Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|---|
| 1 | POST | `/counter/orders` | cajero | Crear pedido de mostrador (Pagado + pago efectivo) |
| 2 | GET | `/counter/orders/recent` | cajero | Últimos pedidos de mostrador (deshacer/auditar) |
| 3 | POST | `/counter/orders/:id/undo` | cajero | Cancelar último pedido si aún Pagado (error de captura) |
| 4 | GET | `/kitchen/orders` | cocinero | Cola: pedidos Pagado + En preparación, FIFO |
| 5 | POST | `/kitchen/orders/:id/start` | cocinero | Pagado → En preparación |
| 6 | POST | `/kitchen/orders/:id/ready` | cocinero | En preparación → Listo |

Validación de todas las transiciones contra `transicion_estado` (research R1).
`409` en transición inválida con `"La operación no está permitida"`.

## 1. POST `/counter/orders`

**Request**:
```json
{
  "clienteNombre": "Opcional",
  "items": [ { "menuDiaId": 42, "cantidad": 2 } ],
  "montoRecibido": "100.00"
}
```

**Respuesta 201**:
```json
{
  "order": { "id": 15, "numero": "MOS-20261110-0001", "tipo": "mostrador", "estado": "Pagado", "total": "70.00" },
  "pago": { "metodo": "efectivo", "monto": "70.00" }
}
```
**Errores**: `400` datos inválidos · `409` item no disponible · `401/403`.

## 2. GET `/counter/orders/recent`

**Respuesta 200**: últimos 10 pedidos mostrador con `{ id, numero, estado, total, creadoEn }`.

## 3. POST `/counter/orders/:id/undo`

Cancela el pedido (estado `Pagado` → `Cancelado`) cuando fue un error de
captura. **409** si ya avanzó a `En preparación` o `Listo` o si no es
mostrador.

## 4. GET `/kitchen/orders`

**Respuesta 200**:
```json
{
  "orders": [
    {
      "id": 15, "numero": "MOS-20261110-0001", "tipo": "mostrador",
      "estado": "Pagado", "creadoEn": "2026-11-10T12:31:00", "minutosEspera": 4,
      "items": [ { "nombre": "Gordita de chicharrón", "cantidad": 2 } ]
    },
    {
      "id": 9, "numero": "PED-20261110-0001", "tipo": "anticipado",
      "estado": "En preparación", "creadoEn": "2026-11-10T12:20:00", "minutosEspera": 15,
      "items": [ { "nombre": "Café americano", "cantidad": 1 } ]
    }
  ]
}
```

## 5. POST `/kitchen/orders/:id/start`

**Respuesta 200**: `{ "order": { "id": 15, "estado": "En preparación" } }`
**Errores**: `409` si el estado actual no es `Pagado`.

## 6. POST `/kitchen/orders/:id/ready`

**Respuesta 200**: `{ "order": { "id": 15, "estado": "Listo" } }`
**Errores**: `409` si el estado actual no es `En preparación`.

## Contrato de UI

| Ruta | Pantalla | Rol |
|---|---|---|
| `/caja` | Captura + cobro + últimos pedidos + deshacer | cajero |
| `/cocina` | KDS: tarjetas grandes con folio, minutos, origen, CTA "Empezar"/"Listo"; polling 10 s | cocinero |

Botones CTA ≥ 44 px, alto contraste (reglas §19). Sin recarga manual.
