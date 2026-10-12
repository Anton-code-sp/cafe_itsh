# Contracts: Fundamentos y Autenticación

Contrato REST de los endpoints de esta feature. Formato: tabla de endpoints
(con el detalle request/response en secciones). Todas las respuestas de error
usan `{ "error": "mensaje claro" }` sin stack traces (reglas §15).

## Convenciones

- Base URL: `http://localhost:3001/api`
- Auth: header `Authorization: Bearer <jwt>` salvo endpoints públicos.
- Content-Type: `application/json`.
- Errores comunes: `400` datos inválidos, `401` sin sesión/credenciales
  inválidas, `403` rol insuficiente, `404` no encontrado, `409` conflicto,
  `500` error interno.

## Endpoints

| # | Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|---|
| 1 | POST | `/auth/login` | público | Iniciar sesión |
| 2 | POST | `/auth/register` | público | Registrar alumno/docente |
| 3 | GET | `/users` | administrador | Listar usuarios operativos |
| 4 | POST | `/users` | administrador | Crear usuario operativo |
| 5 | PATCH | `/users/:id` | administrador | Editar usuario operativo |

## 1. POST `/auth/login`

**Request**:
```json
{ "correo": "alumno@itsx.mx", "password": "PasswordDeEjemplo1" }
```

**Respuesta 200**:
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": 3, "nombre": "Ana López", "correo": "alumno@itsx.mx", "rol": "usuario" }
}
```

**Errores**: `400` formato inválido · `401` credenciales inválidas (mensaje
genérico, no revela si la cuenta existe) · `403` cuenta desactivada.

## 2. POST `/auth/register`

**Request**:
```json
{ "nombre": "Ana López", "correo": "alumno@itsx.mx", "password": "PasswordDeEjemplo1" }
```

**Respuesta 201**:
```json
{ "id": 3, "nombre": "Ana López", "correo": "alumno@itsx.mx", "rol": "usuario" }
```

**Errores**: `400` datos inválidos (correo, password < 8, dominio no
permitido) · `409` correo ya registrado.

## 3. GET `/users`

**Headers**: `Authorization: Bearer <admin jwt>`

**Respuesta 200**:
```json
{
  "users": [
    { "id": 1, "nombre": "Admin", "correo": "admin@itsx.mx", "rol": "administrador", "activo": true }
  ]
}
```

**Errores**: `401` sin token · `403` rol distinto de administrador.

## 4. POST `/users`

**Request**:
```json
{ "nombre": "Luis Caja", "correo": "cajero@itsx.mx", "password": "PasswordDeEjemplo1", "rol": "cajero" }
```

`rol` ∈ `administrador | cajero | cocinero` (solo operativos).

**Respuesta 201**: usuario creado sin `password_hash`.

**Errores**: `400` datos inválidos · `403` rol distinto de administrador ·
`409` correo ya registrado.

## 5. PATCH `/users/:id`

**Request** (campos opcionales):
```json
{ "nombre": "Luis C.", "correo": "cajero@itsx.mx", "activo": false, "rol": "cocinero" }
```

**Respuesta 200**: usuario actualizado.

**Errores**: `400` · `403` · `404` usuario inexistente · `409` correo duplicado.

## Contrato de UI (rutas frontend)

| Ruta | Rol permitido | Pantalla |
|---|---|---|
| `/login` | público | Login + enlace a registro |
| `/admin` | `administrador` | Layout admin + UsuariosPage |
| `/caja` | `cajero` | Placeholder (sprint 4) |
| `/cocina` | `cocinero` | Placeholder (sprint 4) |
| `/menu` | `usuario`, `administrador` (cualquier autenticado) | Placeholder (sprint 2) |
| `/mis-pedidos` | cualquier autenticado | Placeholder (sprint 5) |

Sin sesión → redirect a `/login`. Rol equivocado → pantalla de "Acceso
denegado" (403 amigable).
