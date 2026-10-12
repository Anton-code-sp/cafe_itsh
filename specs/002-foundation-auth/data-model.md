# Data Model: Fundamentos y Autenticación

El esquema completo ya existe en `migrations/001_crear_esquema.sql`. Esta
feature solo usa y consulta las tablas `rol` y `usuario`.

## Entidades de esta feature

### `rol` (existente, seed en 002_seed_inicial.sql)

| Campo | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| nombre | VARCHAR(30) UNIQUE | `administrador`, `cajero`, `cocinero`, `usuario` |
| creado_en | TIMESTAMP | default CURRENT_TIMESTAMP |

### `usuario` (existente)

| Campo | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| nombre | VARCHAR(100) NOT NULL | |
| correo | VARCHAR(150) UNIQUE NOT NULL | normalizado a minúsculas |
| password_hash | VARCHAR(255) NOT NULL | bcrypt; jamás se expone en API |
| activo | BOOLEAN | default TRUE; logout de baja lógica |
| rol_id | INTEGER FK → rol | |
| creado_en / actualizado_en | TIMESTAMP | trigger ya existe |

**Reglas de validación (zod)**:
- `nombre`: 2–100 caracteres.
- `correo`: email válido + dominio en `ALLOWED_EMAIL_DOMAINS` (registro); en
  login solo formato email.
- `password`: mínimo 8 caracteres (registro); login sin política.

**Relaciones**: `usuario.rol_id → rol.id` (muchos a uno).

## Consultas principales

```sql
-- Login: buscar usuario con rol en una sola consulta
SELECT u.id, u.nombre, u.correo, u.password_hash, u.activo, r.nombre AS rol
FROM usuario u JOIN rol r ON r.id = u.rol_id
WHERE u.correo = $1;

-- Registro de cliente: resolver rol 'usuario'
SELECT id FROM rol WHERE nombre = 'usuario';

-- Crear usuario (registro o admin)
INSERT INTO usuario (nombre, correo, password_hash, rol_id)
VALUES ($1, $2, $3, $4) RETURNING id;

-- Admin: listar usuarios operativos
SELECT u.id, u.nombre, u.correo, u.activo, r.nombre AS rol
FROM usuario u JOIN rol r ON r.id = u.rol_id
WHERE r.nombre IN ('cajero', 'cocinero', 'administrador')
ORDER BY r.nombre, u.nombre;

-- Admin: editar (nombre/correo/activo) y cambiar rol
UPDATE usuario SET nombre = $2, correo = $3, activo = $4, rol_id = $5
WHERE id = $1 RETURNING id;

-- Idempotencia del seed
INSERT INTO usuario (nombre, correo, password_hash, rol_id)
SELECT $1, $2, $3, r.id FROM rol r WHERE r.nombre = $4
ON CONFLICT (correo) DO NOTHING;
```

## Estados y transiciones

No aplica en esta feature (estados de pedido son sprint 3–5).

## Impacto en migraciones

**Ninguno.** No se crean tablas nuevas. Las tablas `rol` y `usuario` ya fueron
creadas por `migrations/001_crear_esquema.sql` y sembradas por
`migrations/002_seed_inicial.sql` (roles). La creación de cuentas operativas
la hace el script de seed de usuarios (research R8), no SQL.

## Decisión de exposición API

- `password_hash` NUNCA sale en respuestas.
- Respuestas de usuario: `{ id, nombre, correo, rol, activo }`.
