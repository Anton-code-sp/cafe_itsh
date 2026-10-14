# Tasks: 008-ui-redesign

## Format: `- [ ] [ID] [P|?] [Story] Description`

## Phase 1: Backend — entrega de pedidos Listos

- [x] T001 [US2] `orderService.listReadyForPickup()`: pedidos `Listo` de
  ambos orígenes con número, tipo, cliente, total, partidas, `creado_en` y
  hora de recolección, ordenados por llegada.
- [x] T002 [US2] `orderService.deliverOrder(orderId, actorId)`: delega en
  `transitionOrder(orderId, "Entregado", actorId)`.
- [x] T003 [US2] `counterController`: `readyOrdersHandler` y
  `deliverOrderHandler` (+ `counterRoutes.ts`: `GET /orders/ready`,
  `POST /orders/:id/deliver`).
- [x] T004 [US2] Tests Vitest: servicio (ready list, deliver 200/409/404)
  y rutas (401/403/409/200).
- [x] T005 [US2] `frontend/src/lib/api.ts`: `listReadyOrders()` y
  `deliverOrder(id)`.

## Phase 2: Navegación compartida

- [x] T006 [US1] Componente `RoleNavDrawer` (drawer móvil + panel lateral
  16rem escritorio; perfil, links con activo, logout).
- [x] T007 [US1] Componente `BottomBar` (2 pestañas, badge, ≥56 px).
- [x] T008 [US1] Integrar drawer en `AdminLayout`, `CajaLayout`,
  `CocinaLayout`, `MenuLayout` (bottom bar solo caja y cliente).

## Phase 3: Admin

- [x] T009 [US4] Rutas nuevas en `App.tsx`: índice `/admin` →
  `AdminHomePage`; `/admin/usuarios` → `UsersPage`.
- [x] T010 [US4] `AdminHomePage`: fecha + 4 tarjetas de acciones rápidas
  (Usuarios N activos, Platillos, Menú del día, Reportes).

## Phase 4: Caja

- [x] T011 [US3] Rutas caja en `App.tsx`: `/caja` (home), `/caja/capturar`,
  `/caja/cobro`, `/caja/entregas`.
- [x] T012 [US3] `QuantityStepper` compartido (botones ≥44 px, max 99,
  `−` deshabilitado en 0).
- [x] T013 [US3] `CapturePage`: catálogo con buscador, chips de categoría,
  stepper y barra flotante "Ver cobro" (lógica extraída de `CajaPage`).
- [x] T014 [US3] `CheckoutPage`: desglose, total grande, CTA único
  "Registrar y cobrar" (un solo paso), resultado éxito/error (conserva
  comportamiento actual de reintentar/cancelar).
- [x] T015 [US2] `DeliveriesPage`: lista de `listReadyOrders` con CTA
  "Entregar" (`deliverOrder`) y "Cancelar", estados vacío/error/conflicto.
- [x] T016 [US3] `CajaHomePage`: acción rápida "Capturar pedido" + módulo
  Entregas con contador.
- [x] T017 [US3] Eliminar `CajaPage.tsx` una vez migrada su lógica.

## Phase 5: Cocina

- [x] T018 [US5] `KitchenPage`: polling 4 s (antes 10), indicador
  "act. hace X s" y "Sin conexión — reintentando…" tras 2 fallos.
- [x] T019 [US5] `OrderCard`: folio grande, chip origen, cliente, hora
  registro/recolección, "¡Retrasado!", partidas N× ≥20 px, CTA 48 px.

## Phase 6: Cliente

- [x] T020 [US6] `MenuPage`: buscador en vivo + chips de categoría
  derivados del catálogo; total flotante con `formatCents`.
- [x] T021 [US6] `MyOrdersPage` y `OrderConfirmPage`: aviso "¡Listo para
  recoger!" (borde `status-ready`) cuando estado = Listo.

## Phase 7: Verificación y cierre

- [x] T022 Backend: `npm test`, `npm run typecheck`, `npm run build` en
  verde.
- [x] T023 Frontend: `npm run lint`, `npm run build` en verde; 0 clases
  prohibidas.
- [x] T024 Actualizar `docs/sprints.md` con la feature 008; marcar todas
  las tareas completadas.

## Dependencies & Notes

- T005–T010 dependen de T001–T004 (api.ts y rutas).
- T012 es prerrequisito de T013 y T020.
- Verificación por fase: backend completo en verde antes de iniciar
  frontend; frontend al final.
