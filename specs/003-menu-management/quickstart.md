# Quickstart: Gestión de Menú y Consulta de Menú

Supone Sprint 1 (002) completo: BD migrada, seed de cuentas, backend y
frontend corriendo.

## Comandos

```bash
cd backend && npm run dev     # :3001
cd frontend && npm run dev    # :5173
```

## Escenarios de validación

### V1 — Consulta de menú (US1)

1. Login como alumno → `/menu`.
2. **Esperado**: los 8 platillos del seed con precio, especiales con badge
   (Gordita de chicharrón, Café de olla), cargan en < 1 s.

### V2 — Gestión de catálogo (US2)

1. Login admin → `/admin` → Platillos → crear "Torta de piña" $40.
2. **Esperado**: aparece en el catálogo; error si se guarda sin nombre.
3. Deshabilitar un platillo del catálogo → **esperado**: sigue existiendo,
   marcado inactivo.

### V3 — Publicar en el menú del día (US2)

1. Admin → Menú del día → publicar "Torta de piña" para hoy con precio 40.
2. **Esperado**: la fila aparece en la lista del día.
3. Intentar publicar el mismo platillo dos veces el mismo día →
   **esperado**: error 409 con mensaje claro.

### V4 — Disponibilidad y reflejo inmediato (US1+US2)

1. Con `/menu` abierto en el navegador del alumno, el admin marca
   "Torta de piña" como no disponible.
2. **Esperado**: en ≤ 30 s (o al refrescar), el alumno ve el platillo
   deshabilitado y no seleccionable.
3. El admin cambia un precio → **Esperado**: el alumno ve el nuevo precio en
   el siguiente refresco.

### V5 — Permisos

1. Login como cocinero, intentar `GET /api/dishes` (o abrir la URL de admin)
   → **esperado**: 403 / pantalla de acceso denegado.
2. Sin sesión → **esperado**: redirect a `/login`.

### V6 — Pruebas automatizadas

```bash
cd backend && npm test && npm run typecheck
cd frontend && npm run typecheck
```

**Esperado**: verde.

## Resultado esperado

Admin publica el menú del día; alumnos lo consultan en el móvil con
disponibilidad y especiales reflejados en ≤ 30 s.

## Resultados de la validación (2026-10-12)

Verificación a nivel API con backend en `:3001`; el walkthrough en navegador
queda para la demo del sprint.

| Escenario | Resultado |
|---|---|
| V1 consulta de menú | ✅ login alumno → `GET /api/menu` 200 con los 8 platillos del seed, especiales primero; 401 sin token |
| V2 catálogo | ✅ crear 201, nombre vacío 400, deshabilitar 200 y la fila sigue existiendo inactiva |
| V3 publicación | ✅ publicar hoy 201 (precio congelado), duplicado mismo día 409, precio negativo 400 |
| V4 reflejo | ✅ el siguiente `GET /api/menu` devuelve precio y disponibilidad actualizados (UI lo refleja con polling de 30 s) |
| V5 permisos | ✅ cocinero 403 en `/dishes` y `/admin/menu-day`; sin sesión 401 |
| V6 automatizado | ✅ backend: 67 tests + typecheck en verde; frontend: `tsc -b && vite build` + eslint en verde |

Datos de prueba creados durante la validación eliminados (catálogo y menú de
hoy regresan al seed de 8 platillos).
