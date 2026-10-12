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
2. Cancelar un pedido `Pagado` (aún sin preparación) → **esperado**:
   `Cancelado`; el seed de transiciones permite `Pagado → Cancelado` y la
   política de `Listo` queda para el sprint 4.

### V7 — Pruebas automatizadas

```bash
cd backend && npm test && npm run typecheck
```
Cubrir: ventana 10 min, cálculo de totales, estado inicial, confirmación de
pago, rechazo de transiciones inválidas.

## Resultado esperado

Alumno completa menú → pedido → pago → folio `Pagado`; cocina (en standby)
lo verá como `Pagado` en el sprint 4.

## Resultados de verificación (2026-10-12, nivel API)

Backend con `CUTOFF_TIME` normal (13:00) y override 23:59 para el camino
feliz (la hora local ya rebasa el corte). Smoke: **13/13 OK**; códigos
HTTP vs contrato: **8/8 OK**.

| Escenario | Verificado | Resultado |
|---|---|---|
| V1 Preview del pedido | ✅ API | 200, total $70.00 calculado por servidor, `canOrder:true` |
| V2 Flujo completo con pago | ✅ API | 201 folio `PED-20261012-0002`, confirmación → `Pagado` con monto, detalle con items y pago online |
| V2 Doble confirmación | ✅ API | 409 "ya no está pendiente de pago" |
| V3 Ventana de 10 minutos | ✅ API | Con `CUTOFF_TIME=13:00` y hora local > 12:50: quote `canOrder:false` + creación 409 con mensaje "al menos 10 minutos de anticipación"; con override 23:59 todo el flujo pasa |
| V4 Pago no confirmado | ✅ API | Pedido queda `Pendiente`, `pago:null` al volver con GET |
| V5 Platillo no disponible | ✅ API | Quote rechaza con "no está disponible hoy"; creación → 409 |
| V6 Cancelación | ✅ API | Pendiente→`Cancelado` OK; Pagado→`Cancelado` OK (seed de transiciones) |
| Permisos | ✅ API | Sin sesión 401; pedido ajeno 403 (ver y cancelar); inexistente 404 |
| Validación | ✅ API | Items vacíos 400; cantidad 0 400; query malformada 400 |
| Admin | ✅ API | Admin ve pedidos ajenos 200 |
| V7 Pruebas automatizadas | ✅ | `npm test` 109/109, typecheck backend OK, build+lint frontend OK |
| Seguridad (T026) | ✅ | Sin `password_hash` ni datos de tarjeta en respuestas; sandbox sin campos reales |
