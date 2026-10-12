# Quickstart: Fundamentos y Autenticación

Guía de validación end-to-end de la feature. Supone la BD ya migrada
(ver `docs/ejecutar-migraciones.md`).

## Requisitos previos

```bash
# 1. Base de datos (una vez)
psql -U cafe_admin -h 127.0.0.1 -d cafe_itsh -f migrations/001_crear_esquema.sql
psql -U cafe_admin -h 127.0.0.1 -d cafe_itsh -f migrations/002_seed_inicial.sql

# 2. Variables de entorno del backend (backend/.env) completas
# 3. Seed de cuentas operativas (una vez)
cd backend && npm run seed
```

## Comandos de ejecución

```bash
cd backend && npm run dev        # API en :3001
cd frontend && npm run dev       # SPA en :5173
```

## Escenarios de validación

### V1 — Login por rol (US1)

1. Abrir `http://localhost:5173/login`, entrar con la cuenta de admin →
   **esperado**: redirección a `/admin`.
2. Repetir con cajero → `/caja`; cocinero → `/cocina`; alumno → `/menu`.
3. Contraseña incorrecta → **esperado**: mensaje "Credenciales inválidas"
   (sin indicar si la cuenta existe) y permanencia en `/login`.

### V2 — Rutas protegidas (US1)

1. Con el navegador en sesión de cocinero, escribir `http://localhost:5173/admin`
   → **esperado**: pantalla de acceso denegado (o redirect), sin ver Usuarios.
2. Borrar el token (localStorage) y abrir `/admin` → **esperado**: redirect a
   `/login`.

### V3 — Registro de cliente (US2)

1. En `/login` abrir registro, usar correo institucional no registrado →
   **esperado**: cuenta creada, login automático o redirect a login, acceso a
   `/menu`.
2. Registrar el mismo correo otra vez → **esperado**: error 409 con mensaje
   claro.
3. Correo con dominio no permitido → **esperado**: rechazo con mensaje claro.

### V4 — Cuentas operativas iniciales (US3)

```bash
cd backend && npm run seed   # 1ª vez
cd backend && npm run seed   # 2ª vez
```
**Esperado**: ambas corridas terminan sin error y sin duplicar cuentas
(`SELECT correo, COUNT(*) FROM usuario GROUP BY correo HAVING COUNT(*) > 1;`
retorna 0 filas).

### V5 — Gestión de usuarios operativos (US4)

1. Login como admin → `/admin` → crear cajero nuevo → **esperado**: aparece
   en la lista.
2. Login con el cajero recién creado → funciona en `/caja`.
3. Desactivar un usuario y probar su login → **esperado**: rechazo por cuenta
   desactivada.

### V6 — Pruebas automatizadas

```bash
cd backend && npm test && npm run typecheck
cd frontend && npm test && npm run typecheck   # si hay tests
```

**Esperado**: verde.

## Resultado esperado de la feature

Login → redirección por rol, registro de clientes, gestión de operativos y
rutas protegidas funcionando; todas las pruebas en verde.
