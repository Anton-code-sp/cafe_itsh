# Quickstart: Pedido Anticipado y Pago

Supone Sprints 1–2 completos (login + menú publicado).

## Comandos

```bash
cd backend && npm run dev     # :3001
cd frontend && npm run dev    # :5173
```

## Escenarios de validación

### V1 — Preview del pedido (US1)

1. Login alumno → `/menu` → cantidades 2× Gordita + 1× Café → "Ver pedido".
2. **Esperado**: total calculado por servidor (`$90.00`), lista de items.

### V2 — Flujo completo con pago (US1)

1. En `/cart` confirmar → pagar en `/checkout` (sandbox) → confirmación.
2. **Esperado**: folio `PED-AAAAAAAAN-0001`, estado `Pagado`, detalle correcto.

### V3 — Ventana de 10 minutos (FR-009)

1. Con `CUTOFF_TIME=13:00` y hora local ≥ 12:50, intentar crear pedido →
   **esperado**: rechazo 409 con mensaje "…al menos 10 minutos de
   anticipación".
2. Antes de las 12:50 → **esperado**: pedido creado.

### V4 — Pago no confirmado (FR-014)

1. Crear pedido y **no** confirmar el pago (cerrar en `/checkout`).
2. **Esperado**: pedido `Pendiente`, no cuenta como pagado; al volver con
   `GET /orders/:id` sigue `Pendiente`.

### V5 — Platillos no disponibles (FR-010)

1. Admin marca un platillo no disponible; alumno intenta incluirlo →
   **esperado**: el preview/creación lo rechaza con mensaje claro.

### V6 — Cancelación (FR-016)

1. Cancelar un pedido `Pendiente` → **esperado**: `Cancelado`.
2. Intentar cancelar uno `Pagado` → **esperado**: rechazo.

### V7 — Pruebas automatizadas

```bash
cd backend && npm test && npm run typecheck
```
Cubrir: ventana 10 min, cálculo de totales, estado inicial, confirmación de
pago, rechazo de transiciones inválidas.

## Resultado esperado

Alumno completa menú → pedido → pago → folio `Pagado`; cocina (en standby)
lo verá como `Pagado` en el sprint 4.
