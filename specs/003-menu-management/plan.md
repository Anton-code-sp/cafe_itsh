# Implementation Plan: Gestión de Menú y Consulta de Menú

**Branch**: `003-menu-management` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-menu-management/spec.md`

## Summary

CRUD de platillos y menú del día para el administrador (con especiales,
precios y disponibilidad) más la consulta pública del menú para
alumnos/docentes. Usa las tablas existentes `platillo` y `menu_dia` (el precio
se congela al agregar al menú). La disponibilidad se refleja de inmediato en
`/menu` con refresco periódico en el MVP.

## Technical Context

**Language/Version**: TypeScript 5.9 estricto; backend Node.js LTS; frontend React 19 + Vite

**Primary Dependencies**: Backend: Express 5, pg, zod (ya instalados).
Frontend: React Router, Tailwind + shadcn/ui (ya configurados); fetch puro vía
`lib/api.ts` (evaluar TanStack Query — research R4)

**Storage**: PostgreSQL 18 (`cafe_itsh`); tablas `platillo`, `menu_dia` ya
creadas y sembradas en `migrations/001+002`

**Testing**: Vitest

**Target Platform**: Web responsiva; `/menu` móvil-first

**Project Type**: web-service + web app

**Performance Goals**: consulta de menú < 1 s en red local; refresco de
disponibilidad ≤ 30 s

**Constraints**: reglas §9 (menú refleja cambios de inmediato, no
disponibles no seleccionables), §22 (sin dependencias extra)

**Scale/Scope**: decenas de platillos; ~6 endpoints; 2 pantallas nuevas
(`/admin` menú, `/menu` clientes)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. Alcance MVP | ✅ PASS | Gestión de menú (FR-005/006/007) y consulta (FR-004) están en el alcance |
| II. Seguridad | ✅ PASS | Endpoints de escritura con `authenticate + requireRole('administrador')`; validación zod |
| III. Simplicidad | ✅ PASS | Queries SQL directas con `pg`; sin ORM ni capas extra |
| IV. Rapidez en receso | ✅ PASS | `/menu` ligero, sin consultas N+1, refresco por polling simple |
| V. Calidad verificable | ✅ PASS | Vitest para CRUD, validación y permisos |

**Re-check post-diseño**: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/003-menu-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md             # /speckit.tasks
```

### Source Code (repository root)

```text
backend/src/
├── middlewares/requireRole.ts      # de 002
├── controllers/
│   ├── dishController.ts           # NUEVO: CRUD platillos
│   └── menuController.ts           # NUEVO: menú del día
├── services/
│   ├── dishService.ts              # NUEVO
│   └── menuService.ts              # NUEVO
├── routes/
│   ├── dishRoutes.ts               # NUEVO (admin)
│   └── menuRoutes.ts               # NUEVO (público lectura + admin escritura)
└── app.ts                          # MODIFICAR: registrar rutas

frontend/src/
├── pages/admin/
│   ├── dishes/DishesPage.tsx       # NUEVO: catálogo de platillos
│   └── menu/MenuDayPage.tsx        # NUEVO: menú del día
├── pages/clientes/
│   └── menu/MenuPage.tsx           # NUEVO: consulta pública
├── components/dishes/              # NUEVO: DishFormDialog, DishCard, etc.
├── components/menu/                # NUEVO: MenuDishRow, etc.
└── lib/api.ts                      # EXTENDER: métodos de menú/platillos
migrations/                         # SIN CAMBIOS (esquema ya creado)
```

**Structure Decision**: web application — se agregan archivos a
`backend/src` y `frontend/src/pages` según estructura existente.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
