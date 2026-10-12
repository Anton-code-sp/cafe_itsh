# Research: Fundamentos y Autenticación

Fase 0 del plan. Formato: **Decision / Rationale / Alternatives considered**.

## R1 — Almacenamiento de contraseñas

**Decision**: bcrypt (`bcryptjs`) con costo por defecto (12 rounds).

**Rationale**: Reglas §5 y constitución principio II exigen contraseñas nunca
en texto plano. bcrypt con salt automático es el estándar para credenciales;
`bcryptjs` es puro JS (sin compilación nativa, evita problemas de build en
Windows con `bcrypt`).

**Alternatives considered**:
- `argon2`: más moderno y recomendado por OWASP, pero requiere compilación
  nativa (node-gyp) — innecesario para el volumen de este proyecto.
- SHA-256 con salt: no está diseñado para contraseñas (rápido de atacar con
  GPUs) — descartado por seguridad.

## R2 — Formato y transporte de la sesión

**Decision**: JWT de acceso (`Authorization: Bearer`) con `expiresIn` de 8 h,
firmado con `JWT_SECRET` de `.env`. Payload mínimo: `{ sub, rol, nombre }`.

**Rationale**: Reglas §5 exigen JWT. Sin refresh token en el MVP: la jornada
escolar es corta y menos superficie = menos complejidad (§22). 8 h cubre la
jornada completa sin obligar a re-login en el receso.

**Alternatives considered**:
- Refresh tokens rotativos: más seguro para sesiones largas, pero agrega
  complejidad y una tabla nueva sin necesidad real en el MVP.
- Sesión en cookie httpOnly: válida, pero la app SPA + API separadas se
  simplifican con header Bearer (las cookies cross-origin requieren CORS con
  credentials).

## R3 — Autorización por rol

**Decision**: middleware `requireRole(...roles)` que valida el claim `rol` del
JWT contra la ruta requerida; combinado con `validate` para payloads.

**Rationale**: Un solo middleware pequeño reutilizable (reglas §22: dependencias
mínimas, funciones pequeñas). El rol vive en el JWT; se verifica también en
cada endpoint de escritura.

**Alternatives considered**:
- Middleware genérico con base de datos en cada request: verifica revocaciones
  en vivo, pero cuesta una query por request y el MVP no necesita revocación
  en tiempo real (logout = borrar token en cliente).
- Biblioteca de RBAC (ej. `accesscontrol`): agrega una dependencia para 4 roles
  con reglas fijas — descartada por §22.

## R4 — Migraciones

**Decision**: mantener los scripts SQL planos en `migrations/` ejecutados con
`psql` (ya documentado en `docs/ejecutar-migraciones.md`); esta feature NO
crea migraciones nuevas (el esquema completo ya existe).

**Rationale**: El esquema de las 11 tablas ya está creado y sembrado; agregar
un framework de migraciones (node-pg-migrate, Knex migrations) contradiría
§22 y la regla "no ORMs innecesarios". Un script `003_*.sql` futuro si
aparecen cambios de esquema.

**Alternatives considered**:
- `node-pg-migrate`: aporta control de versiones de esquema, pero solo hay 2
  scripts en total — complejidad desproporcionada.
- Knex: trae ORM/query builder — prohibido por §4 ("no ORMs innecesarios").

## R5 — Cliente HTTP del frontend

**Decision**: `fetch` envuelto en `frontend/src/lib/api.ts` con:
inyección del `Authorization` desde localStorage, manejo de 401 → redirect a
`/login`, y parseo de errores `{ error }`.

**Rationale**: No requiere dependencias (§22). Un solo módulo centraliza el
token y el manejo de errores.

**Alternatives considered**:
- Axios: añade ~13 kB sin aportar nada que `fetch` no cubra — descartado.
- TanStack Query: aporta caché/invalidación, útil en sprints de menú y
  pedidos; se evaluará en el sprint 2. Para auth no hace falta.

## R6 — Estado de sesión en el frontend

**Decision**: React Context (`AuthProvider`) que persiste el JWT en
`localStorage` y expone `{ user, login, logout }`; `ProtectedRoute` verifica
token y rol antes de renderizar la ruta.

**Rationale**: Suficiente para 6 rutas y un token de 8 h; sin dependencias.

**Alternatives considered**:
- Zustand/Redux: estado global con librería — innecesario para un solo dato
  de sesión (§22).
- httpOnly cookies: requeriría cambiar la estrategia de CORS (credentials)
  y complejizar el dev server — se mantiene Bearer por ahora.

## R7 — Validación de correos institucionales

**Decision**: dominio permitido en variable de entorno
`ALLOWED_EMAIL_DOMAINS` (ej. `itsx.mx,its.edu.mx`), validado con zod en el
registro. Si la variable está vacía, se acepta cualquier correo (modo
desarrollo).

**Rationale**: La spec asume correos institucionales sin fijar el dominio; la
configuración por entorno evita hardcodear (§16) y permite probar con
cualquier correo en desarrollo.

**Alternatives considered**:
- Dominio fijo en código: viola §16 (configuración sensible/de entorno) y
  complica las pruebas.

## R8 — Estrategia de seed de cuentas operativas

**Decision**: script idempotente `backend/src/scripts/seedUsers.ts` que crea
admin/cajero/cocinero si no existen (upsert por correo), ejecutable con
`npm run seed`; corre manualmente una vez tras crear la BD. Contraseñas
iniciales desde variables de entorno (`SEED_ADMIN_PASSWORD`, etc.) con
placeholders en desarrollo.

**Rationale**: Spec US3 exige cuentas iniciales sin duplicar en reinicios.
Script separado (no automático al arrancar) = explícito y auditable; passwords
de entorno (§16).

**Alternatives considered**:
- Seed en SQL (como 002_seed_inicial.sql): no puede usar bcrypt desde SQL
  puro sin extensión — descartado.
- Auto-seed en el arranque del servidor: oculta el proceso y puede crear
  cuentas por accidente en producción — descartado.
