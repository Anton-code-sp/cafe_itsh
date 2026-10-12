# Implementation Plan: Mostrador (Cajero) y Cocina

**Branch**: `005-counter-kitchen` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-counter-kitchen/spec.md`

## Summary

Operación interna del receso: el cajero captura y cobra pedidos de mostrador
(creados directamente en `Pagado`), y el cocinero ve en una sola pantalla los
pedidos entrantes (anticipados + mostrador) con orden de preparación,
avanzándolos por la máquina de estados (`En preparación` → `Listo`), validada
contra `transicion_estado`.

## Technical Context

**Language/Version**: TypeScript 5.9 estricto; Node.js LTS; React 19 + Vite

**Primary Dependencies**: Backend: Express 5, pg, zod (existentes). Frontend:
React Router + shadcn/ui; polling simple para actualización sin recarga
(research R3)

**Storage**: PostgreSQL 18; tablas `pedido`, `pedido_detalle`,
`pedido_estado_historial`, `estado_pedido`, `transicion_estado`, `pago` ya
existentes con seed de transiciones

**Testing**: Vitest (máquina de estados, creación de mostrador, permisos)

**Target Platform**: Web responsiva; `/caja` y `/cocina` con botones grandes
(≥44 px, alto contraste — reglas §19)

**Project Type**: web-service + web app

**Performance Goals**: KDS actualizado ≤ 10 s; captura de mostrador < 2 min

**Constraints**: reglas §10 (mostrador no interrumpe), §11 (cocina con orden
claro), §7 (transiciones), constitución IV (rapidez en receso)

**Scale/Scope**: ~50 pedidos/receso; ~6 endpoints; 2 pantallas nuevas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. Alcance MVP | ✅ PASS | Mostrador (FR-019) y cocina (FR-020/021) en alcance |
| II. Seguridad | ✅ PASS | `authenticate + requireRole` por rol (cajero/cocinero); validación server-side de transiciones |
| III. Simplicidad | ✅ PASS | Validación de estados con query a `transicion_estado` (datos, no código); polling sin infraestructura extra |
| IV. Rapidez en receso | ✅ PASS | Captura en pocos pasos; KDS con CTA grande y actualización automática |
| V. Calidad verificable | ✅ PASS | Vitest: transiciones válidas/inválidas, permisos por rol, creación de mostrador |

**Re-check post-diseño**: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/005-counter-kitchen/
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
│   ├── orderService.ts        # EXTENDER: creación de mostrador + transiciones
│   └── kitchenService.ts      # NUEVO: cola de cocina
├── controllers/
│   ├── counterController.ts   # NUEVO (o en orderController)
│   └── kitchenController.ts   # NUEVO
├── routes/
│   ├── counterRoutes.ts       # NUEVO (cajero)
│   └── kitchenRoutes.ts       # NUEVO (cocinero)
└── app.ts                     # MODIFICAR

frontend/src/
├── pages/caja/CajaPage.tsx              # NUEVO: captura de mostrador
├── pages/cocina/KitchenPage.tsx         # NUEVO: KDS
├── components/kitchen/OrderCard.tsx     # NUEVO: tarjeta de alto contraste
├── components/counter/CounterCart.tsx   # NUEVO: items del pedido de mostrador
└── lib/api.ts                           # EXTENDER
migrations/                              # SIN CAMBIOS
```

**Structure Decision**: web application — archivos nuevos bajo carpetas existentes.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
