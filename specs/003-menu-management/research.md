# Research: Gestión de Menú y Consulta de Menú

Fase 0. Formato: **Decision / Rationale / Alternatives**.

## R1 — Modelo de disponibilidad

**Decision**: `menu_dia.disponible BOOLEAN` por platillo-fecha; los platillos
inactivos del catálogo (`platillo.activo = FALSE`) se excluyen de futuras
publicaciones. La consulta pública filtra `disponible = TRUE`.

**Rationale**: El esquema ya existe así; un solo booleano por fecha permite
agotar un platillo durante el receso sin tocar el catálogo.

**Alternatives**: stock numérico (inventario) — fuera de alcance (spec 001:
"no habrá gestión de inventario").

## R2 — Reflejar cambios "de inmediato" en `/menu`

**Decision**: polling cada 30 s con `refetch` simple en `/menu` (y foco de
ventana como trigger extra). MVP sin WebSockets.

**Rationale**: Cumple el requisito funcional (FR-007) con cero dependencias y
cero complejidad de infraestructura; el receso dura minutos, 30 s de latencia
es aceptable.

**Alternatives**:
- WebSockets/SSE: actualización instantánea pero agrega infraestructura de
  conexiones — evaluar solo si la demo muestra el 30 s como problema.
- TanStack Query con `refetchInterval`: aporta caché/reintentos; se evalúa en
  research R4.

## R3 — Precio congelado vs precio vivo

**Decision**: el precio de la venta SIEMPRE es `menu_dia.precio` (congelado al
publicar); cambiar el precio del catálogo NO modifica menús ya publicados; el
admin puede editar el precio de una fila del menú del día (update directo de
`menu_dia.precio`).

**Rationale**: El esquema lo previene (`pedido_detalle.precio_unitario`
congelado al pedir). Evita que un cambio retroactivo altere pedidos ya
creados.

**Alternatives**: precio vivo del catálogo — rompería el total de pedidos
existentes.

## R4 — Cliente de datos del frontend para menú

**Decision**: empezar con `fetch` + hook `useMenu` (state + polling) en
`frontend/src/lib/api.ts`; **adoptar TanStack Query** solo si durante el
sprint se necesitan revalidación compartida y caché entre páginas.

**Rationale**: §22 (dependencias mínimas). Dos pantallas no justifican una
librería de datos; el polling es una línea con `setInterval`.

**Alternatives**: TanStack Query desde ahora — 1 dependencia más; se pospone
hasta demostrar necesidad.

## R5 — Endpoints: rutas separadas vs mezcladas

**Decision**: `GET /api/menu?fecha=YYYY-MM-DD` público (cualquier autenticado
o anónimo según UI) y `GET /api/menu/admin` + escritura bajo `/api/admin/...`
con rol admin: `GET/POST/PATCH /api/dishes`, `GET/POST/PATCH
/api/admin/menu-day`.

**Rationale**: separa claramente lectura pública de escritura administrativa
y hace trivial el guard por rol.

**Alternatives**: un solo prefijo `/menu` con permisos por método — más
confuso de auditar.

## R6 — Especiales del día

**Decision**: columna `menu_dia.especial BOOLEAN` (ya existe); la UI marca
especiales con badge; el admin alterna con un switch por fila. Sin tabla
separada.

**Rationale**: ya está modelado; nada más que construir.

**Alternatives**: tabla `especial` propia — duplicaría `menu_dia`.
