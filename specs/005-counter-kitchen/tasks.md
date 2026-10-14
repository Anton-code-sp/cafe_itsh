---

description: "Task list — Mostrador (Cajero) y Cocina (005)"
---

# Tasks: Mostrador (Cajero) y Cocina

**Input**: Design documents from `/specs/005-counter-kitchen/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: requeridos (máquina de estados, mostrador, cola, permisos).

**Organization**: Tasks grouped by user story (US1–US2).

## Phase 1: Setup

- [x] T001 [P] Verificar con `migrations/001_crear_esquema.sql` el CHECK de `pedido` (mostrador admite NULLs) y el shape exacto de `pago` antes de escribir `counterService`

---

## Phase 2: Foundational (Blocking)

**⚠️ CRITICAL**: bloquea ambas historias

- [x] T002 Implementar `transitionOrder(orderId, hacia, actorId)` en `backend/src/services/orderService.ts` (valida contra `transicion_estado`, UPDATE + historial en transacción, errores 409 claros — research R1) con tests en `backend/src/services/orderService.transition.test.ts` (transición válida/inválida/no existente)
- [x] T003 [P] Verificar navegación por rol existente (`frontend/src/lib/paths.ts`
  `homePathForRol`: cajero→`/caja`, cocinero→`/cocina`) y añadir links/guards en
  `frontend/src/pages/` si falta alguno hacia `/caja` o `/cocina`
  — verificado: redirect post-login por rol en `LoginPage` + `ProtectedRoute`
  con `roles` en `App.tsx`; no falta ningún link/guard

**Checkpoint**: máquina de estados central y lista

---

## Phase 3: User Story 1 - Capturar y cobrar pedidos de mostrador (Priority: P1) 🎯 MVP

**Goal**: el cajero cobra en pocos toques y el pedido entra a la cola como
`Pagado`

**Independent Test**: login cajero → quickstart V1 y V2

### Tests for User Story 1

- [x] T004 [P] [US1] Test de creación de mostrador en `backend/src/services/orderService.test.ts` (estado inicial Pagado, pago efectivo registrado, total del servidor)
- [x] T005 [P] [US1] Test de `undo` en `backend/src/services/orderService.test.ts` (Pagado→Cancelado ok; En preparación → rechazo)
- [x] T006 [P] [US1] Test de permisos cajero en `backend/src/routes/counterRoutes.test.ts` (cocinero/alumno → 403)

### Implementation for User Story 1

- [x] T007 [US1] Implementar `createCounterOrder` (pedido mostrador + detalles + pago efectivo en una transacción) en `backend/src/services/orderService.ts` (research R2), con folio `MOS-YYYYMMDD-NNNN`: extender `backend/src/utils/orderNumber.ts` (`formatOrderNumber` con prefijo parametrizable, default `PED`) + tests
- [x] T008 [US1] Implementar `undoCounterOrder` (cancelar si Pagado) en `backend/src/services/orderService.ts`
- [x] T009 [US1] Implementar `GET /counter/orders/recent`, `POST /counter/orders`, `POST /counter/orders/:id/undo` en `backend/src/controllers/counterController.ts` + `backend/src/routes/counterRoutes.ts` con `requireRole('cajero')`
- [x] T010 [US1] Registrar `counterRoutes` en `backend/src/app.ts`
- [ ] T011 [P] [US1] Extender `frontend/src/lib/api.ts` con `createCounterOrder`, `listRecentCounterOrders`, `undoCounterOrder`
- [ ] T012 [US1] Crear `frontend/src/components/counter/CounterCart.tsx` (items + cantidad + total en vivo + cambio calculado)
- [ ] T013 [US1] Crear `frontend/src/pages/caja/CajaPage.tsx` (buscador del menú de hoy, cart, botón "Cobrar y crear pedido" CTA grande, últimos 10 con "Deshacer")
- [ ] T014 [US1] Montar `CajaPage` como elemento `index` de `CajaLayout` en `frontend/src/App.tsx` (la ruta `/caja` ya está registrada con `ProtectedRoute roles=["cajero"]`)
- [ ] T015 [US1] Verificar quickstart V1 y V2

**Checkpoint**: cajero opera de forma independiente

---

## Phase 4: User Story 2 - Administrar la cocina (Priority: P2)

**Goal**: cocinero ve una sola cola clara y avanza pedidos con un clic

**Independent Test**: quickstart V3–V6 (cola, avance, polling, permisos)

### Tests for User Story 2

- [ ] T016 [P] [US2] Test de cola en `backend/src/services/kitchenService.test.ts` (retorna Pagado+En preparación, FIFO por creado_en, incluye tipos)
- [ ] T017 [P] [US2] Test de flujo cocina en `backend/src/services/kitchenService.test.ts` (start solo desde Pagado; ready solo desde En preparación; historial correcto)
- [ ] T018 [P] [US2] Test de permisos cocinero en `backend/src/routes/kitchenRoutes.test.ts` (cajero → 403)

### Implementation for User Story 2

- [ ] T019 [US2] Implementar `getKitchenQueue` en `backend/src/services/kitchenService.ts` (query FIFO de `data-model.md`)
- [ ] T020 [US2] Implementar `POST /kitchen/orders/:id/start` y `/ready` en `backend/src/controllers/kitchenController.ts` + `backend/src/routes/kitchenRoutes.ts` (delegan en `transitionOrder`) con `requireRole('cocinero')`
- [ ] T021 [US2] Registrar `kitchenRoutes` en `backend/src/app.ts`
- [ ] T022 [P] [US2] Extender `frontend/src/lib/api.ts` con `getKitchenQueue`, `startOrder`, `readyOrder`
- [ ] T023 [US2] Crear `frontend/src/components/kitchen/OrderCard.tsx` (folio, minutos de espera, badge origen, items, CTA ≥ 44 px)
- [ ] T024 [US2] Crear `frontend/src/pages/cocina/KitchenPage.tsx` (grid de tarjetas + polling 10 s + refresco tras acción — research R3)
- [ ] T025 [US2] Montar `KitchenPage` como elemento `index` de `CocinaLayout` en `frontend/src/App.tsx` (la ruta `/cocina` ya está registrada con `ProtectedRoute roles=["cocinero"]`)
- [ ] T026 [US2] Verificar quickstart V3–V6

**Checkpoint**: US1 + US2 completas — operación interna funcional

---

## Phase 5: Polish & Cross-Cutting

- [ ] T027 [P] `npm run typecheck` y `npm run build` en `backend/` y `frontend/`
- [ ] T028 [P] Revisar tamaños CTA y contraste en `/caja` y `/cocina` (reglas §19)
- [ ] T029 Correr `specs/005-counter-kitchen/quickstart.md` completo y registrar resultados
- [ ] T030 Actualizar `docs/sprints.md`: Sprint 4 completado tras demo

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → US1 → US2 → Polish**
- US1 y US2 dependen de T002 (transiciones) pero entre sí son
  independientes

### Parallel Opportunities

- T004–T006 con T016–T018 (tests de ambas historias)
- T011–T013 (caja) en paralelo con T019–T021 (cocina backend)

## Implementation Strategy

### MVP First (US1)

1. T002 (transiciones) + US1 completa → quickstart V1/V2 → demo

### Incremental Delivery

2. US2 (cocina) → V3–V6 → **demo Sprint 4 completa**: cajero cobra, cocina
   avanza, alumno ve progreso en su pedido (pendiente de US3 del sprint 5
   para estados en su vista)

## Notes

- T002 es la pieza compartida: anticipados del sprint 3 y mostrador del
  sprint 4 usan la misma `transitionOrder`
- Commits pequeños por tarea o grupo lógico
- **Análisis `/speckit.analyze` (2026-10-13)**: sin CRÍTICOS. Correcciones
  aplicadas a este archivo: (1) T007 ahora cubre el prefijo `MOS-` del folio
  de mostrador (`formatOrderNumber` solo genera `PED-`); (2) T014/T025
  apuntan a `App.tsx` y a montar las páginas en los layouts existentes (las
  rutas ya están registradas con `ProtectedRoute`); (3) T003 referenciaba
  `lib/auth.ts` inexistente — la navegación por rol vive en `lib/paths.ts`.
  Verificado contra migraciones: CHECK `mostrador` admite `usuario_id`,
  `cliente_nombre` y `fecha_recoleccion` en NULL; `pago` tiene
  `registrado_por` (T001).
