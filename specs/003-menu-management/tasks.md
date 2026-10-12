---

description: "Task list — Gestión de Menú y Consulta de Menú (003)"
---

# Tasks: Gestión de Menú y Consulta de Menú

**Input**: Design documents from `/specs/003-menu-management/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: requeridos por constitución (principio V) y por la spec → se incluyen.

**Organization**: Tasks grouped by user story (US1–US2).

## Phase 1: Setup

- [X] T001 [P] Verificar que el seed del menú existe y `GET /api/menu` responde con los platillos de ejemplo (contrato base antes de tocar UI)

---

## Phase 2: Foundational (Blocking)

**⚠️ CRITICAL**: depende de Phase 1; bloquea ambas historias

- [X] T002 [P] Extender `frontend/src/lib/api.ts` con tipos y funciones `getMenu`, `getDishes`, `createDish`, `updateDish`, `getMenuDay`, `publishMenuDay`, `updateMenuDayRow`
- [X] T003 Crear esquemas zod compartidos de platillo/menú en `backend/src/validations/menuSchemas.ts` (nombre, precio ≥ 0, fecha, flags)
- [X] T004 [P] Preparar navegación de admin: menú lateral/links en `frontend/src/pages/admin/AdminLayout.tsx` hacia `DishesPage` y `MenuDayPage`

**Checkpoint**: contrato de datos listo

---

## Phase 3: User Story 1 - Consultar el menú del día (Priority: P1) 🎯 MVP

**Goal**: alumno ve menú con precios, especiales y disponibilidad en el móvil

**Independent Test**: login alumno → `/menu` con el seed visible (quickstart V1)

### Tests for User Story 1

- [X] T005 [P] [US1] Test de lectura pública en `backend/src/services/menuService.test.ts` (fecha con menú → items con join de catálogo; solo `platillo.activo = TRUE`)
- [X] T006 [P] [US1] Test de permisos en `backend/src/routes/menuRoutes.test.ts` (sin token → 401; alumno autenticado → 200)

### Implementation for User Story 1

- [X] T007 [US1] Implementar `getMenuByDate` en `backend/src/services/menuService.ts` (query con JOIN de `data-model.md`, orden especiales primero)
- [X] T008 [US1] Implementar `GET /api/menu` en `backend/src/controllers/menuController.ts` + `backend/src/routes/menuRoutes.ts` (query `fecha` opcional, default `CURRENT_DATE`)
- [X] T009 [US1] Registrar `menuRoutes` en `backend/src/app.ts`
- [X] T010 [P] [US1] Crear `frontend/src/pages/clientes/menu/MenuPage.tsx` (lista con `DishCard`: nombre, descripción, precio peso 700, badge especial, no disponible deshabilitado)
- [X] T011 [US1] Añadir polling de 30 s + al enfocar la ventana en `frontend/src/pages/clientes/menu/MenuPage.tsx` (research R2)
- [X] T012 [US1] Estado vacío comprensible en `frontend/src/pages/clientes/menu/MenuPage.tsx` cuando no hay menú
- [X] T013 [US1] Verificar quickstart V1 y V4 (reflejo de cambios ≤ 30 s)

**Checkpoint**: US1 completa — el alumno consulta el menú

---

## Phase 4: User Story 2 - Gestionar menú, platillos y precios (Priority: P2)

**Goal**: admin crea platillos, publica el menú del día y gestiona precio/disponibilidad/especial

**Independent Test**: crear platillo, publicarlo, cambiar precio y
deshabilitarlo, verificando efecto en `/menu` (quickstart V2/V3/V4)

### Tests for User Story 2

- [X] T014 [P] [US2] Test de CRUD de platillos en `backend/src/services/dishService.test.ts` (crear/ editar/ deshabilitar; nombre vacío rechazado)
- [X] T015 [P] [US2] Test de publicación en `backend/src/services/menuService.test.ts` (publicar ok; duplicado mismo día → conflicto; precio negativo → rechazo)
- [X] T016 [P] [US2] Test de permisos admin en `backend/src/routes/dishRoutes.test.ts` y `menuDayRoutes` (cocinero → 403; admin → 200)

### Implementation for User Story 2

- [X] T017 [US2] Implementar `listDishes`, `createDish`, `updateDish` en `backend/src/services/dishService.ts`
- [X] T018 [US2] Implementar `GET/POST /api/dishes` y `PATCH /api/dishes/:id` en `backend/src/controllers/dishController.ts` + `backend/src/routes/dishRoutes.ts` con `authenticate + requireRole('administrador')`
- [X] T019 [US2] Implementar `getMenuDayAdmin`, `publishMenuDay`, `updateMenuDayRow` en `backend/src/services/menuService.ts` (upsert por `ON CONFLICT` research R3)
- [X] T020 [US2] Implementar rutas `/api/admin/menu-day` en `backend/src/controllers/menuDayController.ts` + `backend/src/routes/menuDayRoutes.ts` con rol admin
- [X] T021 [US2] Registrar `dishRoutes` y `menuDayRoutes` en `backend/src/app.ts`
- [X] T022 [P] [US2] Crear `frontend/src/pages/admin/dishes/DishesPage.tsx` (tabla shadcn + switch activo + botón crear)
- [X] T023 [US2] Crear `frontend/src/components/dishes/DishFormDialog.tsx` (crear/editar con validación zod en cliente)
- [X] T024 [P] [US2] Crear `frontend/src/pages/admin/menu/MenuDayPage.tsx` (lista editable: precio, disponible, especial, selector de fecha)
- [X] T025 [US2] Crear `frontend/src/components/menu/PublishDishDialog.tsx` (publicar platillo del catálogo en una fecha con precio)
- [X] T026 [US2] Verificar quickstart V2, V3 y V5 (permisos)

**Checkpoint**: US1 + US2 completas — flujo admin → alumno funcional

---

## Phase 5: Polish & Cross-Cutting

- [X] T027 [P] `npm run typecheck` y `npm run build` en `backend/` y `frontend/`
- [X] T028 [P] Revisar mensajes de error y ausencia de stack traces (reglas §15)
- [X] T029 Correr `specs/003-menu-management/quickstart.md` completo y registrar resultados
- [X] T030 Actualizar `docs/sprints.md`: Sprint 2 completado tras demo

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → US1/US2** secuencial por fases
- **US1 puede avanzar en paralelo con US2** una vez lista Phase 2 (el seed ya
  provee menú de prueba)
- **US2 completa** la feature; US1 es el MVP demostrable

### Parallel Opportunities

- T002 y T004 en paralelo
- Tests US1 (T005–T006) en paralelo con tests US2 (T014–T016)
- T010 en paralelo con T017–T021

## Implementation Strategy

### MVP First (US1)

1. Phase 1 + 2
2. US1 completa → validar quickstart V1/V4 → demo: alumno consulta menú

### Incremental Delivery

1. US1 (consulta) → demo
2. US2 (gestión) → validar → **demo Sprint 2 completa**: admin publica,
   alumno ve en móvil

## Notes

- [P] = archivos distintos sin dependencias
- Commits pequeños por tarea o grupo lógico
