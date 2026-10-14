# Implementation Plan: Base de Diseño UI

**Branch**: `007-ui-foundation` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-ui-foundation/spec.md`

## Summary

Instalar el sistema de diseño que el repo declara obligatorio pero no existe:
tokens de `.stitch/DESIGN.md` en Tailwind v4 (`@theme`), fuentes Plus Jakarta
Sans + Inter, shadcn/ui con componentes base personalizados, componente
`StatusBadge` para los 6 estados, y migración de las pantallas existentes de
la paleta ámbar/stone a los tokens. Después, el Sprint 4 (`005`) construye
caja/cocina sobre esta base.

## Technical Context

**Language/Version**: TypeScript ~6.0 estricto; React 19 + Vite 8

**Primary Dependencies**: Tailwind CSS v4 (`@tailwindcss/vite`, sin
tailwind.config — tokens en CSS), shadcn/ui (Radix UI, clsx, tailwind-merge,
class-variance-authority, lucide-react)

**Storage**: sin cambios de base de datos (feature solo de frontend)

**Testing**: `tsc -b` + `vite build` + `eslint`; verificación visual de
pantallas migradas (smoke)

**Target Platform**: Web responsiva; móvil-first (reglas §19)

**Constraints**: reglas §2 (shadcn + tokens DESIGN.md), §19 (área táctil
≥44 px, foco visible), DESIGN.md (verde solo acciones, nunca fondo grande)

**Scale/Scope**: ~15 archivos TSX migrados, 1 CSS, 1 HTML, ~7 componentes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. Alcance MVP | ✅ PASS | Sin funcionalidad nueva; solo presentación (pulido previsto para Sprint 5) |
| II. Seguridad | ✅ PASS | Sin cambios de auth/API; sin secretos |
| III. Simplicidad | ✅ PASS | Tokens en CSS nativo de Tailwind v4; componentes copiados, sin build tooling nuevo |
| IV. Rapidez en receso | ✅ PASS | Legibilidad y CTA ≥44 px mejoran la operación en receso |
| V. Calidad verificable | ✅ PASS | build/lint/typecheck en verde; grep sin clases ámbar de acción |

**Re-check post-diseño**: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/007-ui-foundation/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
frontend/
├── index.html                    # MODIFICAR: fuentes Google Fonts
└── src/
    ├── index.css                 # MODIFICAR: @theme con tokens DESIGN.md
    ├── components/
    │   ├── ui/                   # NUEVO: shadcn (button, card, input, label, badge, dialog)
    │   └── StatusBadge.tsx       # NUEVO: badge de estados de pedido
    └── pages/ y components/      # MODIFICAR: migración amber/stone → tokens
```

**Structure Decision**: web application — componentes bajo `components/ui/`
(convención shadcn exigida por reglas §200).

## Complexity Tracking

Sin violaciones de la constitución que justificar.
