---

description: "Task list — Fundamentos y Autenticación (002)"
---

# Tasks: Fundamentos y Autenticación

**Input**: Design documents from `/specs/002-foundation-auth/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: La spec y la constitución (principio V) exigen pruebas de
autenticación, autorización y control de permisos → se incluyen tareas de tests.

**Organization**: Tasks grouped by user story (US1–US4).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: base común de backend/frontend para la feature

- [ ] T001 Asegurar conexión a BD: revisar `DATABASE_URL` en `backend/.env` apunta a `cafe_itsh` y `backend/src/db/pool.ts` conecta sin errores
- [ ] T002 [P] Añadir variables de seed y dominios a `backend/.env` y `backend/.env.example`: `SEED_ADMIN_PASSWORD`, `SEED_CAJERO_PASSWORD`, `SEED_COCINERO_PASSWORD`, `ALLOWED_EMAIL_DOMAINS` (ver research R7/R8)
- [ ] T003 [P] Extender `backend/src/config/env.ts` para validar las nuevas variables opcionales y `backend/src/config/env.test.ts` con sus casos

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: middleware, cliente API y router base que TODAS las historias usan

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Crear middleware `requireRole` en `backend/src/middlewares/requireRole.ts` (lee claim `rol` del JWT, responde 403 si no coincide)
- [ ] T005 Crear middleware `authenticate` en `backend/src/middlewares/authenticate.ts` (verifica `Authorization: Bearer`, 401 si falta/inválido)
- [ ] T006 [P] Crear cliente API del frontend en `frontend/src/lib/api.ts` (fetch con token de localStorage, parseo de `{ error }`, redirect 401 → `/login`)
- [ ] T007 [P] Instalar y configurar React Router en `frontend/src/main.tsx` con las 6 rutas base: `/login`, `/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos`
- [ ] T008 Crear contexto de sesión `AuthProvider` en `frontend/src/lib/auth.ts` (login/logout, persistencia del JWT, `user.rol`)
- [ ] T009 Crear componente `ProtectedRoute` en `frontend/src/components/ProtectedRoute.tsx` (verifica sesión + rol; redirect a `/login` o pantalla de acceso denegado)

**Checkpoint**: Fundación lista — las historias pueden avanzar en paralelo

---

## Phase 3: User Story 1 - Iniciar sesión y acceder según el rol (Priority: P1) 🎯 MVP

**Goal**: login con JWT y redirección por rol en las 6 rutas protegidas

**Independent Test**: crear cuentas de cada rol, iniciar sesión con cada una y
verificar llegada a la ruta correcta y denegación entre roles (quickstart V1/V2)

### Tests for User Story 1

- [ ] T010 [P] [US1] Test de login exitoso en `backend/src/services/authService.test.ts` (contraseña válida → payload con rol correcto)
- [ ] T011 [P] [US1] Test de login fallido en `backend/src/services/authService.test.ts` (contraseña/correo inválidos → error genérico que no revela existencia)
- [ ] T012 [P] [US1] Test del middleware `authenticate` en `backend/src/middlewares/authenticate.test.ts` (sin token → 401; token inválido → 401; token válido → next)
- [ ] T013 [P] [US1] Test de `requireRole` en `backend/src/middlewares/requireRole.test.ts` (rol correcto → next; rol incorrecto → 403)

### Implementation for User Story 1

- [ ] T014 [US1] Implementar `login` en `backend/src/services/authService.ts` (buscar usuario+rol con JOIN, comparar bcrypt, generar JWT 8 h — research R1/R2)
- [ ] T015 [US1] Implementar `POST /auth/login` en `backend/src/controllers/authController.ts` + `backend/src/routes/authRoutes.ts` (validación zod del body)
- [ ] T016 [US1] Registrar `authRoutes` en `backend/src/app.ts` bajo `/api/auth`
- [ ] T017 [P] [US1] Crear `frontend/src/pages/login/LoginPage.tsx` (formulario correo/password con shadcn, errores en línea, link a registro)
- [ ] T018 [US1] Conectar `AuthProvider` + `ProtectedRoute` en `frontend/src/main.tsx` con rutas por rol: `/admin`→administrador, `/caja`→cajero, `/cocina`→cocinero, `/menu` y `/mis-pedidos`→cualquier autenticado
- [ ] T019 [US1] Crear layouts placeholder: `frontend/src/pages/admin/AdminLayout.tsx`, `frontend/src/pages/caja/CajaLayout.tsx`, `frontend/src/pages/cocina/CocinaLayout.tsx`, `frontend/src/pages/clientes/MenuLayout.tsx`
- [ ] T020 [US1] Verificar quickstart V1 y V2 manualmente (login 4 roles + denegación entre rutas)

**Checkpoint**: US1 completa — login y rutas protegidas funcionan de forma independiente

---

## Phase 4: User Story 2 - Registrarse como alumno o docente (Priority: P2)

**Goal**: registro libre solo para clientes con validación de dominio

**Independent Test**: registrar correo institucional nuevo, iniciar sesión y
llegar a `/menu` (quickstart V3)

### Tests for User Story 2

- [ ] T021 [P] [US2] Test de registro en `backend/src/services/userService.test.ts` (correo nuevo → crea con rol `usuario`; correo existente → conflicto)
- [ ] T022 [P] [US2] Test de validación de dominio en `backend/src/config/env.test.ts` (dominio permitido → ok; no permitido → rechazo)

### Implementation for User Story 2

- [ ] T023 [US2] Implementar `registerClient` en `backend/src/services/userService.ts` (resolver rol `usuario`, hash bcrypt, `ON CONFLICT` → 409)
- [ ] T024 [US2] Implementar `POST /auth/register` en `backend/src/controllers/authController.ts` con esquema zod (nombre 2–100, email, password ≥ 8, dominio permitido)
- [ ] T025 [P] [US2] Crear componente de registro en `frontend/src/pages/login/RegisterForm.tsx` y mostrarlo desde `frontend/src/pages/login/LoginPage.tsx`
- [ ] T026 [US2] Verificar quickstart V3 manualmente (registro ok, duplicado 409, dominio rechazado)

**Checkpoint**: US1 + US2 completas — clientes se registran e ingresan

---

## Phase 5: User Story 3 - Cuentas operativas iniciales (Priority: P3)

**Goal**: script de seed idempotente para admin/cajero/cocinero

**Independent Test**: ejecutar `npm run seed` dos veces sin duplicados
(quickstart V4)

### Tests for User Story 3

- [ ] T027 [P] [US3] Test de idempotencia en `backend/src/scripts/seedUsers.test.ts` (segunda corrida no duplica — usar transacción de prueba)

### Implementation for User Story 3

- [ ] T028 [US3] Crear script `backend/src/scripts/seedUsers.ts` (upsert por correo con `ON CONFLICT DO NOTHING`, passwords desde `.env` — research R8)
- [ ] T029 [US3] Añadir script `"seed": "tsx src/scripts/seedUsers.ts"` en `backend/package.json`
- [ ] T030 [US3] Verificar quickstart V4 (doble corrida sin duplicados)

**Checkpoint**: cuentas operativas disponibles para demo

---

## Phase 6: User Story 4 - Gestionar usuarios operativos (Priority: P3)

**Goal**: admin crea/edita/deshabilita cajeros y cocineros desde `/admin`

**Independent Test**: crear un cajero como admin, iniciar sesión con él,
denegar la gestión a otros roles (quickstart V5)

### Tests for User Story 4

- [ ] T031 [P] [US4] Test de `requireRole('administrador')` en los endpoints de `backend/src/routes/userRoutes.test.ts` (admin → 200; cocinero → 403; sin token → 401)
- [ ] T032 [P] [US4] Test de creación de operativo en `backend/src/services/userService.test.ts` (rol `cajero` → creado; correo duplicado → 409)

### Implementation for User Story 4

- [ ] T033 [US4] Implementar `listOperatives`, `createOperative`, `updateOperative` en `backend/src/services/userService.ts` (solo roles operativos, nunca expone `password_hash`)
- [ ] T034 [US4] Implementar `GET /users`, `POST /users`, `PATCH /users/:id` en `backend/src/controllers/userController.ts` + `backend/src/routes/userRoutes.ts` con `authenticate` + `requireRole('administrador')`
- [ ] T035 [US4] Registrar `userRoutes` en `backend/src/app.ts` bajo `/api/users`
- [ ] T036 [P] [US4] Crear tabla/lista de usuarios en `frontend/src/pages/admin/UsersPage.tsx` (shadcn Table + botón crear)
- [ ] T037 [US4] Crear diálogo de creación/edición en `frontend/src/components/users/UserFormDialog.tsx` (validación zod en cliente)
- [ ] T038 [US4] Verificar quickstart V5 manualmente (crear, login del nuevo, desactivar)

**Checkpoint**: US1–US4 completas — feature funcional de punta a punta

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T039 [P] Verificar `npm run typecheck` y `npm run build` en `backend/` y `frontend/`
- [ ] T040 [P] Revisar mensajes de error: sin stack traces ni información interna (reglas §15)
- [ ] T041 [P] Revisar que ningún endpoint devuelva `password_hash` (grep de respuestas)
- [ ] T042 Correr todo el quickstart completo (`specs/002-foundation-auth/quickstart.md`) y registrar resultados
- [ ] T043 Actualizar `docs/sprints.md` marcando Sprint 1 como completado tras la demo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: sin dependencias
- **Phase 2 (Foundational)**: depende de Phase 1 — BLOQUEA todas las historias
- **Phase 3 (US1)**: depende de Phase 2 — prioridad máxima
- **Phase 4 (US2)**: depende de US1 (reutiliza authController/login flow)
- **Phase 5 (US3)**: depende de Phase 1 (env de seeds); independiente de US1/US2
- **Phase 6 (US4)**: depende de Phase 2 (authenticate/requireRole) y de US3 (cuentas)
- **Phase 7**: depende de US1–US4

### Parallel Opportunities

- Fase 1: T002 y T003 en paralelo con T001
- Fase 2: T006 y T007 en paralelo con T004–T005
- US1: T010–T013 (tests) en paralelo; T017 en paralelo con T014–T016
- US4: T031–T032 (tests) en paralelo con T033

## Implementation Strategy

### MVP First (US1)

1. Phase 1 + Phase 2
2. Phase 3 (US1) completa → **STOP y VALIDAR** (quickstart V1/V2)
3. Demo: login con los 4 roles

### Incremental Delivery

1. US1 (login+rutas) → validar → demo
2. US2 (registro) → validar → demo
3. US3 (seed) → validar
4. US4 (gestión admin) → validar → **demo Sprint 1 completa**
5. Polish + quickstart completo

## Notes

- [P] = archivos distintos, sin dependencias
- Cada historia es testeable e independiente
- Commits pequeños tras cada tarea o grupo lógico
