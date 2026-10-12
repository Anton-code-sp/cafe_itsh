# Contracts: Gestión de Menú y Consulta de Menú

Convenciones generales iguales a `specs/002-foundation-auth/contracts/api.md`
(base URL `/api`, Bearer JWT, errores `{ error }`).

## Endpoints

| # | Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|---|
| 1 | GET | `/menu?fecha=YYYY-MM-DD` | público autenticado* | Menú del día |
| 2 | GET | `/dishes` | administrador | Catálogo completo |
| 3 | POST | `/dishes` | administrador | Crear platillo |
| 4 | PATCH | `/dishes/:id` | administrador | Editar/deshabilitar platillo |
| 5 | GET | `/admin/menu-day?fecha=` | administrador | Menú del día con filas editables |
| 6 | POST | `/admin/menu-day` | administrador | Publicar platillo en el menú |
| 7 | PATCH | `/admin/menu-day/:id` | administrador | Precio/disponibilidad/especial |

\* La consulta de menú se sirve autenticada porque la SPA siempre tiene sesión
en `/menu`; si se decide público, quitar el guard no cambia el contrato.

## 1. GET `/menu?fecha=2026-10-13`

**Respuesta 200**:
```json
{
  "fecha": "2026-10-13",
  "items": [
    {
      "id": 42, "nombre": "Gordita de chicharrón", "categoria": "Comida",
      "descripcion": "Gordita de maíz con chicharrón prensado",
      "precio": "35.00", "disponible": true, "especial": true
    }
  ]
}
```
Solo incluye platillos del catálogo `activo`. **Errores**: `401` sin sesión.

## 2. GET `/dishes`

**Respuesta 200**: `{ "dishes": [ { id, nombre, categoria, descripcion, activo } ] }`
**Errores**: `401` · `403` rol ≠ administrador.

## 3. POST `/dishes`

**Request**: `{ "nombre": "Torta de piña", "categoria": "Comida", "descripcion": "..." }`
**Respuesta 201**: platillo creado.
**Errores**: `400` (nombre vacío/largo) · `403` · `500`.

## 4. PATCH `/dishes/:id`

**Request** (parcial): `{ "nombre": "...", "activo": false }`
**Respuesta 200**: platillo actualizado.
**Errores**: `400` · `403` · `404`.

## 5. GET `/admin/menu-day?fecha=2026-10-13`

**Respuesta 200**:
```json
{
  "fecha": "2026-10-13",
  "items": [ { "id": 7, "nombre": "Café de olla", "precio": "20.00", "disponible": true, "especial": true, "disponible_en_catalogo": true } ]
}
```
**Errores**: `401` · `403`.

## 6. POST `/admin/menu-day`

**Request**: `{ "fecha": "2026-10-13", "platilloId": 5, "precio": "20.00", "especial": false }`
**Respuesta 201**: fila del menú creada.
**Errores**: `400` (precio < 0, fecha inválida) · `403` · `409` (ya publicado ese día).

## 7. PATCH `/admin/menu-day/:id`

**Request** (parcial): `{ "precio": "22.00", "disponible": false, "especial": true }`
**Respuesta 200**: fila actualizada → visible en `GET /menu` en el siguiente
refresco (≤ 30 s).
**Errores**: `400` · `403` · `404`.

## Contrato de UI

| Ruta | Rol | Pantalla |
|---|---|---|
| `/menu` | autenticado | Lista de platillos del día con precio, badge de especial, no disponibles deshabilitados; polling 30 s |
| `/admin` → menú | administrador | Tabs/links: **Platillos** (`DishesPage`) y **Menú del día** (`MenuDayPage`) |

Flujo admin: crear platillo → publicarlo en el menú con precio → alternar
disponible/especial → el alumno lo ve en `/menu`.
