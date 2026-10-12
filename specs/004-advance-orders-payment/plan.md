# Implementation Plan: Pedido Anticipado y Pago

**Branch**: `004-advance-orders-payment` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-advance-orders-payment/spec.md`

## Summary

El alumno/docente selecciona platillos del menú, ve el total, paga por
adelantado y obtiene folio con estado `Pagado`. Nacen las tablas `pedido`,
`pedido_detalle` y `pago` (ya existentes en migraciones), con validación de la
ventana de 10 minutos contra la hora de corte, cálculo de totales en el
servidor y un adaptador de pago externo con sandbox para desarrollo.

## Technical Context

**Language/Version**: TypeScript 5.9 estricto; Node.js LTS; React 19 + Vite

**Primary Dependencies**: Backend: Express 5, pg, zod (existentes). Frontend:
React Router, shadcn/ui, `lib/api.ts`. Pasarela: adaptador propio con
`PAYMENT_API_KEY` (sandbox en dev — research R3)

**Storage**: PostgreSQL 18; tablas `pedido`, `pedido_detalle`, `pago`,
`estado_pedido`, `transicion_estado` ya creadas y sembradas

**Testing**: Vitest (cálculo de totales, ventana de 10 min, transiciones,
permisos)

**Target Platform**: Web responsiva

**Project Type**: web-service + web app

**Performance Goals**: creación de pedido < 1 s; cálculo de total en servidor

**Constraints**: reglas §7 (10 minutos), §8 (sin datos de tarjeta),
§14 (validación server-side); constitución II (pagos, secretos en env)

**Scale/Scope**: decenas de pedidos por receso; ~5 endpoints; 3 pantallas
(carrito, pago, confirmación)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. Alcance MVP | ✅ PASS | Pedido anticipado + pago (FR-008…FR-014) dentro de alcance |
| II. Seguridad | ✅ PASS | Sin datos de tarjeta (solo referencia de transacción); `PAYMENT_API_KEY` en env; importes calculados en servidor |
| III. Simplicidad | ✅ PASS | Adaptador de pago propio de ~1 archivo; sin SDK pesado; sin ORM |
| IV. Rapidez en receso | ✅ PASS | Flujo de 3 pasos; validación de ventana con una query |
| V. Calidad verificable | ✅ PASS | Vitest: totales, ventana, estados, permisos |

**Re-check post-diseño**: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/004-advance-orders-payment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
backend/src/
├── services/
│   ├── orderService.ts            # NUEVO: creación, validación 10 min, total
│   ├── paymentService.ts          # NUEVO: adaptador sandbox + webhook/confirmación
│   └── menuService.ts             # de 003 (lectura del menú)
├── controllers/
│   ├── orderController.ts         # NUEVO
│   └── paymentController.ts       # NUEVO
├── routes/
│   ├── orderRoutes.ts             # NUEVO
│   └── paymentRoutes.ts           # NUEVO
├── utils/
│   ├── money.ts                   # NUEVO: cálculo/parseo NUMERIC
│   └── orderNumber.ts             # NUEVO: folio del pedido
└── app.ts                         # MODIFICAR

frontend/src/
├── pages/clientes/
│   ├── menu/MenuPage.tsx          # MODIFICAR: botón de cantidad + carrito
│   ├── cart/CartPage.tsx          # NUEVO: resumen y total
│   ├── checkout/PaymentPage.tsx   # NUEVO: flujo de pago sandbox
│   └── orders/OrderConfirmPage.tsx# NUEVO: folio + estado
└── lib/api.ts                     # EXTENDER: createOrder, createPayment
migrations/                        # SIN CAMBIOS
```

**Structure Decision**: web application — archivos nuevos bajo las carpetas existentes.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
