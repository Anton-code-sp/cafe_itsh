# Implementation Plan: Seguimiento de Pedidos y Notificaciones

**Branch**: `006-order-tracking-notifications` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-order-tracking-notifications/spec.md`

## Summary

Cierre del MVP: el alumno ve su lista de pedidos con el estado actual y
recibe avisos cuando cambia (sandbox de correo/consola + tabla
`notificacion`); el admin obtiene un reporte básico de ventas; pulido de UX,
accesibilidad y demo completa del flujo end-to-end (alumno → caja/cocina →
alumno).

## Technical Context

**Language/Version**: TypeScript 5.9 estricto; Node.js LTS; React 19 + Vite

**Primary Dependencies**: Backend: Express 5, pg, zod (existentes).
Notificaciones: canal sandbox (log/consola + persistencia en `notificacion`);
correo real se conecta por env (research R2). Frontend: React Router,
shadcn/ui, polling (research R3)

**Storage**: PostgreSQL 18; tabla `notificacion` ya existente (canal
`correo|push|sms`, estado `pendiente|enviada|fallida`)

**Testing**: Vitest (listado con filtro de dueño, disparo de notificación al
cambiar estado, permisos de reporte)

**Target Platform**: Web responsiva; estados visibles sin color solo como
código (reglas §19: texto + color)

**Project Type**: web-service + web app

**Performance Goals**: estado visible ≤ 10 s en `/mis-pedidos`; notificación
disparada en la misma transición de estado

**Constraints**: reglas §8 (sin datos sensibles en notificaciones),
§15 (mensajes comprensibles), constitución II/III/IV

**Scale/Scope**: reporte 1 pantalla; ~4 endpoints; 2–3 vistas nuevas/ajustes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. Alcance MVP | ✅ PASS | Seguimiento (FR-025…FR-028), notificaciones (FR-029…FR-030) y pulido (US2) cerran la spec maestra |
| II. Seguridad | ✅ PASS | `/mis-pedidos` solo dueño; reporte solo admin; notificaciones sin datos sensibles |
| III. Simplicidad | ✅ PASS | Sandbox de correo por env (log); sin proveedor externo obligatorio en MVP |
| IV. Rapidez en receso | ✅ PASS | Estados legibles en una pantalla; notificación reduce incertidumbre |
| V. Calidad verificable | ✅ PASS | Vitest + demo quickstart end-to-end |

**Re-check post-diseño**: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/006-order-tracking-notifications/
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
│   ├── orderService.ts        # EXTENDER: al transicionar, encolar notificación
│   ├── notificationService.ts # NUEVO: crear + enviar (sandbox) + marcar estado
│   └── reportService.ts       # NUEVO: ventas por día/estado
├── controllers/
│   ├── myOrdersController.ts  # NUEVO
│   └── reportController.ts    # NUEVO
├── routes/
│   ├── myOrdersRoutes.ts      # NUEVO
│   └── reportRoutes.ts        # NUEVO
└── app.ts                     # MODIFICAR

frontend/src/
├── pages/clientes/orders/MyOrdersPage.tsx     # NUEVO: lista + estados
├── components/orders/OrderStatusBadge.tsx     # NUEVO: badge consistente
├── pages/admin/reports/ReportsPage.tsx        # NUEVO: reporte básico
└── lib/api.ts                                 # EXTENDER
migrations/                                    # SIN CAMBIOS
```

**Structure Decision**: web application — archivos nuevos bajo carpetas existentes.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
