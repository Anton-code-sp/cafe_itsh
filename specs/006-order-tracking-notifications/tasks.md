---

description: "Task list — Seguimiento de Pedidos y Notificaciones (006)"
---

# Tasks: Seguimiento de Pedidos y Notificaciones

**Input**: Design documents from `/specs/006-order-tracking-notifications/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: requeridos (dueño-only, notificación en transición, reporte, permisos).

**Organization**: Tasks grouped by user story (US1–US2).

## Phase 1: Setup

- [x] T001 [P] Añadir `NOTIFY_CHANNEL` (default `console`) a `backend/.env` y `.env.example` y validarla en `backend/src/config/env.ts`; crear y aplicar `migrations/003_notificacion_mensaje.sql` (`asunto`, `cuerpo`, `intentos`, `usuario_id` en `notificacion`)

---

## Phase 2: Foundational (Blocking)

**⚠️ CRITICAL**: bloquea ambas historias

- [x] T002 Implementar `notificationService.createAndEnqueue(userId, orderId, status)` en `backend/src/services/notificationService.ts` (inserta fila `pendiente` + `render(status)` research R4) con tests en `backend/src/services/notificationService.test.ts` (asunto/cuerpo correctos, sin datos sensibles)
- [x] T003 Integrar el encolado en `transitionOrder` (005 T002) en `backend/src/services/orderService.ts` (misma transacción — research R1) con test de regresión (transición → notificación creada)
- [x] T004 [P] Reutilizar `frontend/src/components/StatusBadge.tsx` (ya existe desde 007: texto + color por estado — data-model) como badge único en todas las pantallas que muestren estado (no crear componente nuevo)

**Checkpoint**: notificación enlazada a la máquina de estados + badge listo

---

## Phase 3: User Story 1 - Seguir el estado de mis pedidos y recibir aviso (Priority: P1) 🎯 MVP

**Goal**: alumno ve todos sus pedidos con estado actual y recibe aviso

**Independent Test**: quickstart V1–V4

### Tests for User Story 1

- [x] T005 [P] [US1] Test de `myOrdersService.listMine` en `backend/src/services/myOrdersService.test.ts` (solo pedidos del dueño, con estado)
- [x] T006 [P] [US1] Test de detalle en `backend/src/services/myOrdersService.test.ts` (historial ordenado; pedido ajeno → error)
- [x] T007 [P] [US1] Test de permisos en `backend/src/routes/myOrdersRoutes.test.ts` (sin sesión → 401; ajeno → 403)

### Implementation for User Story 1

- [x] T008 [US1] Implementar `listMine`, `getMine`, `flushPending` en `backend/src/services/myOrdersService.ts` + `notificationService.ts` (flush sandbox console research R2)
- [x] T009 [US1] Implementar `GET /my-orders`, `GET /my-orders/:id`, `GET /my-orders/:id/notifications` en `backend/src/controllers/myOrdersController.ts` + `backend/src/routes/myOrdersRoutes.ts`
- [x] T010 [US1] Registrar `myOrdersRoutes` en `backend/src/app.ts` y disparar `flushPending` por intervalo corto (dev) o tras `transitionOrder`
- [x] T011 [P] [US1] Extender `frontend/src/lib/api.ts` con `getMyOrders`, `getMyOrder`, `getOrderNotifications`
- [x] T012 [US1] Crear `frontend/src/pages/clientes/orders/MyOrdersPage.tsx` (lista + badge + polling 15 s + focus — research R3)
- [x] T013 [US1] Crear `frontend/src/pages/clientes/orders/MyOrderDetailPage.tsx` (detalle + historial)
- [x] T014 [US1] Registrar `/mis-pedidos` y `/mis-pedidos/:id` en `frontend/src/App.tsx` (reemplazar el placeholder actual)
- [x] T015 [US1] Verificar quickstart V1–V4

**Checkpoint**: alumno con visibilidad completa y avisos sandbox

---

## Phase 4: User Story 2 - Cierre del MVP: pulido y demo (Priority: P2)

**Goal**: reporte admin, pulido de UX y demo end-to-end

**Independent Test**: quickstart V5 y V6

### Tests for User Story 2

- [ ] T016 [P] [US2] Test de reporte en `backend/src/services/reportService.test.ts` (agregados por estado/tipo, rango inválido → error)
- [ ] T017 [P] [US2] Test de permisos en `backend/src/routes/reportRoutes.test.ts` (no admin → 403)

### Implementation for User Story 2

- [ ] T018 [US2] Implementar `getSalesReport` en `backend/src/services/reportService.ts` (query de `data-model.md`)
- [ ] T019 [US2] Implementar `GET /admin/reports/sales` en `backend/src/controllers/reportController.ts` + `backend/src/routes/reportRoutes.ts` con `requireRole('administrador')` y registrar en `app.ts`
- [ ] T020 [P] [US2] Extender `frontend/src/lib/api.ts` con `getSalesReport`
- [ ] T021 [US2] Crear `frontend/src/pages/admin/reports/ReportsPage.tsx` (tabla shadcn de agregados, selector de rango) y link en el layout de admin
- [ ] T022 [US2] Pulido: textos de error en lenguaje de receso (research R6), ocultar cancelación en UI para `Listo`/`Entregado`, estados legibles sin solo-color
- [ ] T023 [US2] Auditoría visual: contrastes y CTA ≥ 44 px en `/mis-pedidos`, `/caja`, `/cocina` (reglas §19)
- [ ] T024 [US2] Verificar quickstart V5 y V6 (demo end-to-end)

**Checkpoint**: MVP completo funcional

---

## Phase 5: Polish & Cross-Cutting

- [ ] T025 [P] `npm run typecheck` y `npm run build` en `backend/` y `frontend/`
- [ ] T026 [P] Revisar logs y respuestas: sin stack traces, sin datos sensibles (reglas §8/§15)
- [ ] T027 Correr TODOS los quickstarts (002–006) de punta a punta y registrar resultados en `docs/verificacion-final.md`
- [ ] T028 Actualizar `docs/sprints.md`: Sprint 5 completado; marcar roadmap final

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → US1 → US2 → Polish**
- US1 y US2 dependen de Phase 2 (notificación enlazada + badge)

### Parallel Opportunities

- T005–T007 en paralelo con T008–T010
- T011–T013 (frontend alumno) en paralelo con backend de US1

## Implementation Strategy

### MVP First (US1)

1. Phase 1 + 2
2. US1 completa → quickstart V1–V4 → demo
3. US2 → reporte + pulido → **demo final Sprint 5** con flujo end-to-end

## Notes

- No añadir dependencias (nodemailer, charts) sin aprobación explícita §16
- Commits pequeños por tarea o grupo lógico
