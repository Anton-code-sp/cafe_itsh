# Plan: 008-ui-redesign

## Summary

Rediseño de presentación por rol (drawer + bottom bar, landing de admin,
caja en 4 rutas, KDS mejorado, menú de cliente con búsqueda/categorías) y
los 2 endpoints de caja que faltan para entregar pedidos `Listo`
(FR-016 de la spec maestra). Fuente de diseño: `design/diseño-*.md`.

## Technical Context

- **Stack**: React 19 + Vite + Tailwind v4 (`@theme` con tokens de
  `.stitch/DESIGN.md`) + shadcn/ui; Express 5 + TS (ESM) + SQL crudo;
  Vitest.
- **Sin dependencias nuevas**: `lucide-react` ya está instalado; el drawer
  y la bottom bar se construyen con Tailwind + React Router.
- **Backend**: solo se agregan `listReadyForPickup` y `deliverOrder`
  reutilizando `transitionOrder` (la tabla `transicion_estado` ya tiene
  `Listo → Entregado`).
- **Restricciones**: `docs/reglas.md` §19 (targets ≥44 px), §27 (alcance),
  §22 (sin deps nuevas); verificación por fase (backend test + frontend
  lint/build).

## Constitution Check *(must update after implementation)*

- §I MVP scope: la entrega (`Listo → Entregado`) es parte de FR-016 de la
  spec maestra; no es alcance nuevo, es una pieza faltante.
- §II Quality: tests Vitest para los endpoints nuevos; lint/build en verde.
- §VI Agent workflow: rama `spec/008-ui-redesign`, commits pequeños con
  IDs de tareas.

## Project Structure

### Backend (modificados)

```
backend/src/services/orderService.ts            # +listReadyForPickup, +deliverOrder
backend/src/services/orderService.transition.test.ts  # casos Entregado
backend/src/controllers/counterController.ts    # +readyOrdersHandler, +deliverOrderHandler
backend/src/routes/counterRoutes.ts             # +GET /orders/ready, +POST /orders/:id/deliver
backend/src/routes/counterRoutes.test.ts        # 401/403/409/200
backend/src/services/orderService.test.ts       # tests de listReadyForPickup
```

### Frontend (nuevos y modificados)

```
frontend/src/components/nav/RoleNavDrawer.tsx   # NUEVO drawer + panel lateral
frontend/src/components/nav/BottomBar.tsx       # NUEVO bottom bar 2 pestañas
frontend/src/components/counter/QuantityStepper.tsx  # NUEVO stepper ≥44 px
frontend/src/pages/admin/AdminHomePage.tsx      # NUEVO landing
frontend/src/pages/admin/AdminLayout.tsx        # MODIFICAR drawer
frontend/src/pages/caja/CajaHomePage.tsx        # NUEVO landing
frontend/src/pages/caja/CapturePage.tsx         # NUEVO catálogo (parte de CajaPage)
frontend/src/pages/caja/CheckoutPage.tsx        # NUEVO resumen (parte de CajaPage)
frontend/src/pages/caja/DeliveriesPage.tsx      # NUEVO entregas
frontend/src/pages/caja/CajaLayout.tsx          # MODIFICAR drawer + bottom bar
frontend/src/pages/cocina/CocinaLayout.tsx      # MODIFICAR drawer
frontend/src/pages/cocina/KitchenPage.tsx       # MODIFICAR sondeo 4 s
frontend/src/components/kitchen/OrderCard.tsx   # MODIFICAR tarjeta
frontend/src/pages/clientes/MenuLayout.tsx      # MODIFICAR drawer + bottom bar
frontend/src/pages/clientes/menu/MenuPage.tsx   # MODIFICAR buscador/categorías
frontend/src/pages/clientes/orders/MyOrdersPage.tsx  # MODIFICAR aviso Listo
frontend/src/pages/clientes/orders/OrderConfirmPage.tsx # MODIFICAR aviso Listo
frontend/src/lib/api.ts                         # +listReadyOrders, +deliverOrder
frontend/src/App.tsx                            # MODIFICAR rutas caja/admin
```

## Complexity Tracking

| Violación | Justificación |
|---|---|
| 2 endpoints nuevos de backend | Expone FR-016 ya aprobada (Listo→Entregado); sin esto la US2 no es testeable de forma independiente |
| Landing + split de `/caja` | Requerido por los documentos de diseño aprobados por la patrocinadora |
