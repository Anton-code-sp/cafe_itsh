# Implementation Plan: Fundamentos y Autenticación

**Branch**: `002-foundation-auth` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-foundation-auth/spec.md`

## Summary

Construir la base del sistema: esquema de usuarios/roles ya existente en
`migrations/`, autenticación con JWT (login/registro de clientes), carga
inicial de cuentas operativas, gestión de usuarios operativos por el
administrador, y el esqueleto del frontend (React + Vite con rutas por rol
protegidas). Esta feature habilita todas las demás: sin sesión y control por
rol no hay menú, pedidos ni operación.

## Technical Context

**Language/Version**: TypeScript 5.9 estricto; backend en Node.js LTS; frontend React 19 + Vite

**Primary Dependencies**: Backend: Express 5, pg, zod, jsonwebtoken, bcryptjs, cors.
Frontend: React Router, Tailwind CSS + shadcn/ui, TanStack Query (o fetch puro — ver research.md)

**Storage**: PostgreSQL 18 local (`127.0.0.1:5432/cafe_itsh`); esquema completo
ya creado en `migrations/001_crear_esquema.sql` + seed en `002_seed_inicial.sql`
(tablas `usuario`, `rol` ya operativas)

**Testing**: Vitest (unit + integración vía `app.listen` en puerto efímero)

**Target Platform**: Web responsiva (móvil y escritorio); backend servidor Node

**Project Type**: web-service (API REST) + web app (SPA)

**Performance Goals**: login < 1 s en red local; navegación entre rutas < 200 ms

**Constraints**: reglas §2 (app única con rutas por rol protegidas por JWT),
§5 (contraseñas nunca en texto plano, secretos en variables de entorno),
§22 (dependencias mínimas)

**Scale/Scope**: ~10 usuarios operativos + cientos de alumnos/docentes;
6 rutas frontend (`/login`, `/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos`);
~7 endpoints (auth + users)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. Alcance estricto del MVP | ✅ PASS | Login, registro de clientes y gestión de usuarios operativos están en el alcance (spec 001 FR-001/002 y US6) |
| II. Seguridad de la información | ✅ PASS | bcrypt para contraseñas, JWT con `JWT_SECRET` en `.env`, validación con zod, secretos fuera del código (ver research.md) |
| III. Simplicidad y mantenibilidad | ✅ PASS | Estructura `backend/src/{routes,controllers,services,middlewares}` existente; sin ORM; sin capas extra |
| IV. Rapidez operativa en receso | ✅ PASS | Login de un paso; redirección directa al módulo del rol; UI mínima |
| V. Calidad verificable | ✅ PASS | Vitest sobre auth, autorización por rol y validación |

**Re-check post-diseño (Phase 1)**: sin violaciones → Complexity Tracking vacío.

## Project Structure

### Documentation (this feature)

```text
specs/002-foundation-auth/
├── plan.md              # Este archivo
├── research.md          # Phase 0: decisiones técnicas
├── data-model.md        # Phase 1: entidades usuario/rol y consultas
├── quickstart.md        # Phase 1: guía de validación
├── contracts/           # Phase 1: contrato REST auth/users
└── tasks.md             # Phase 2: generado por /speckit.tasks
```

### Source Code (repository root)

```text
backend/src/
├── config/env.ts                # ya existe (validación zod de .env)
├── db/pool.ts                   # ya existe
├── middlewares/
│   ├── errorHandler.ts          # ya existe
│   ├── validate.ts              # ya existe (zod)
│   └── requireRole.ts           # NUEVO: autorización por rol
├── controllers/
│   ├── health.ts                # ya existe
│   ├── authController.ts        # NUEVO: login/registro
│   └── userController.ts        # NUEVO: CRUD usuarios operativos
├── services/
│   ├── authService.ts           # NUEVO: bcrypt + JWT
│   └── userService.ts           # NUEVO: consultas de usuario
├── routes/
│   ├── health.ts                # ya existe
│   ├── authRoutes.ts            # NUEVO
│   └── userRoutes.ts            # NUEVO
├── app.ts                       # NUEVO: registrar rutas nuevas
└── index.ts                     # ya existe

frontend/src/
├── main.tsx                     # router + providers NUEVO
├── lib/api.ts                   # NUEVO: cliente fetch con token
├── lib/auth.ts                  # NUEVO: contexto de sesión
├── components/
│   ├── ui/                      # shadcn/ui (copiados bajo demanda)
│   └── ProtectedRoute.tsx       # NUEVO: guard por rol
├── pages/
│   ├── login/LoginPage.tsx      # NUEVO
│   ├── admin/AdminLayout.tsx    # NUEVO
│   ├── admin/UsersPage.tsx      # NUEVO: gestión de operativos
│   ├── caja/CajaLayout.tsx      # NUEVO (placeholder con "en construcción")
│   ├── cocina/CocinaLayout.tsx  # NUEVO (placeholder)
│   └── clientes/MenuLayout.tsx  # NUEVO (placeholder /menu y /mis-pedidos)
migrations/
└── (ya existe; no se modifica en esta feature)
```

**Structure Decision**: web application (Opción 2) — `backend/` + `frontend/`
ya existentes en el repo. Esta feature solo agrega archivos nuevos; no
reorganiza estructura existente.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
