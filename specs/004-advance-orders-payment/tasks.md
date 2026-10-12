---

description: "Task list — Pedido Anticipado y Pago (004)"
---

# Tasks: Pedido Anticipado y Pago

**Input**: Design documents from `/specs/004-advance-orders-payment/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: requeridos (ventana 10 min, totales, estados, pagos, permisos).

**Organization**: una user story (US1) + Polish.

## Phase 1: Setup

- [x] T001 [P] Añadir `CUTOFF_TIME` y `TZ` a `backend/.env` y `backend/.env.example` y validarlas en `backend/src/config/env.ts` con test en `backend/src/config/env.test.ts` (research R1)

---

## Phase 2: Foundational (Blocking)

**⚠️ CRITICAL**: bloquea la historia

- [x] T002 Crear `backend/src/utils/money.ts` (calcular/parsear `NUMERIC(10,2)` sin errores de punto flotante) con tests en `backend/src/utils/money.test.ts`
- [x] T003 Crear `backend/src/utils/orderNumber.ts` (folio `PED-YYYYMMDD-XXXX`, reintento ante colisión de UNIQUE) con tests
- [x] T004 Crear `backend/src/utils/cutoff.ts` (verifica ≥ 10 minutos antes de `CUTOFF_TIME`, devuelve `{ ok, reason }`) con tests de bordes (10:00 exacto, 9:59)
- [x] T005 [P] Añadir rutas nuevas al sidebar/menú de cliente en `frontend/src/pages/clientes/MenuLayout.tsx` (carrito con contador)

**Checkpoint**: utilidades de dominio listas y probadas

---

## Phase 3: User Story 1 - Realizar un pedido anticipado con pago (Priority: P1) 🎯 MVP

**Goal**: alumno selecciona, ve total del servidor, paga (sandbox) y obtiene
folio `Pagado`

**Independent Test**: quickstart V1–V6 sin intervención de cajero/cocinero

### Tests for User Story 1

- [x] T006 [P] [US1] Test de `orderService.quote` en `backend/src/services/orderService.test.ts` (total correcto, item no disponible → error)
- [x] T007 [P] [US1] Test de creación de pedido en `backend/src/services/orderService.test.ts` (estado inicial Pendiente, detalles con precio congelado, total = suma servidor)
- [x] T008 [P] [US1] Test de ventana en `backend/src/services/orderService.test.ts` (fuera de ventana → rechazo con mensaje claro)
- [x] T009 [P] [US1] Test de `paymentService` en `backend/src/services/paymentService.test.ts` (confirmar → pago registrado + pedido Pagado; doble confirmación → rechazo)
- [x] T010 [P] [US1] Test de permisos en `backend/src/routes/orderRoutes.test.ts` (pedido ajeno → 403; sin sesión → 401)

### Implementation for User Story 1

- [x] T011 [US1] Implementar `quote` y `createOrder` en `backend/src/services/orderService.ts` (transacción: INSERT pedido + detalles, precio desde `menu_dia`, validación de ventana y disponibilidad — research R1/R2)
- [x] T012 [US1] Implementar `paymentService.createPayment` (sandbox) y `confirmPayment` en `backend/src/services/paymentService.ts` (interfaz de adaptador, research R3)
- [x] T013 [US1] Implementar `cancelOrder` en `backend/src/services/orderService.ts` (solo estados Pendiente/Pagado, actualiza `pedido_estado_historial`)
- [x] T014 [US1] Implementar `GET /orders/quote`, `POST /orders`, `GET /orders/:id`, `POST /orders/:id/cancel` en `backend/src/controllers/orderController.ts` + `backend/src/routes/orderRoutes.ts`
- [x] T015 [US1] Implementar `POST /payments/:orderId/confirm` en `backend/src/controllers/paymentController.ts` + `backend/src/routes/paymentRoutes.ts`
- [x] T016 [US1] Registrar `orderRoutes` y `paymentRoutes` en `backend/src/app.ts`
- [x] T017 [P] [US1] Extender `frontend/src/lib/api.ts` con `quoteOrder`, `createOrder`, `getOrder`, `cancelOrder`, `confirmPayment`
- [x] T018 [US1] Añadir selector de cantidades + botón "Ver pedido" en `frontend/src/pages/clientes/menu/MenuPage.tsx`
- [x] T019 [US1] Crear `frontend/src/pages/clientes/cart/CartPage.tsx` (resumen con total del servidor, aviso de ventana, botón "Pagar")
- [x] T020 [US1] Crear `frontend/src/pages/clientes/checkout/PaymentPage.tsx` (form sandbox **sin campos de tarjeta reales**, botón confirmar)
- [x] T021 [US1] Crear `frontend/src/pages/clientes/orders/OrderConfirmPage.tsx` (folio, estado, detalle, botón cancelar si aplica)
- [x] T022 [US1] Registrar rutas nuevas (`/cart`, `/checkout`, `/orders/:id`) en `frontend/src/main.tsx` protegidas por sesión
- [x] T023 [US1] Manejo de errores de ventana/no disponible en `frontend/src/pages/clientes/cart/CartPage.tsx` (mensaje claro del servidor)
- [x] T024 [US1] Verificar quickstart V1–V6 manualmente

**Checkpoint**: flujo alumno completo funcional e independiente

---

## Phase 4: Polish & Cross-Cutting

- [x] T025 [P] `npm run typecheck` y `npm run build` en `backend/` y `frontend/`
- [x] T026 [P] Verificar que ninguna respuesta contiene datos de tarjeta ni `password_hash`
- [x] T027 [P] Revisar códigos HTTP según contrato (`409` ventana, `400` validación, `403` ajeno)
- [x] T028 Correr `specs/004-advance-orders-payment/quickstart.md` completo y registrar resultados
- [x] T029 Actualizar `docs/sprints.md`: Sprint 3 completado tras demo

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → US1 → Polish**
- Los tests (T006–T010) pueden correr en paralelo con la implementación
  T011–T016 si se desarrollan TDD; si no, van después de T011–T016

### Parallel Opportunities

- T001 con T002–T004
- T002–T004 entre sí (archivos distintos)
- T017–T018 (frontend) en paralelo con T014–T016 (backend)

## Implementation Strategy

### MVP First

1. Phase 1 + 2
2. US1 backend (T011–T016) → probar con curl/quickstart API
3. US1 frontend (T017–T023) → flujo completo en navegador
4. **STOP y VALIDAR**: quickstart V1–V6 → demo Sprint 3

## Notes

- El sandbox de pago NO toca datos reales de tarjeta (reglas §8)
- Commits pequeños por tarea o grupo lógico
