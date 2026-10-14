# Feature Specification: Rediseño UI por rol (drawer, bottom bar y pantallas)

**Feature Branch**: `008-ui-redesign`

**Created**: 2026-10-14

**Status**: Draft

**Input**: Propuestas de `design/diseño-operativo.md`, `design/diseño-cocina.md`
y `design/diseño-cliente.md` (corregidas 2026-10-14) sobre la base de
`specs/007-ui-foundation/` (tokens + `StatusBadge` ya implementados).
Derivada de la spec maestra `specs/001-advance-order-system/spec.md`
(FR-015, FR-016, FR-017, FR-020) y `docs/reglas.md` §19.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegación por rol con drawer y bottom bar (Priority: P1)

Como usuario operativo (admin, cajero, cocinero) o cliente, quiero una
navegación con **drawer lateral** (y **bottom bar** en móvil para caja y
cliente) en lugar de los links del header, para llegar a cada sección con un
toque desde el teléfono durante el receso.

**Why this priority**: es el prerrequisito común de los 4 rediseños; sin
ella cada pantalla propuesta no tiene forma de llegar.

**Independent Test**: en móvil y escritorio, abrir `/admin`, `/caja`,
`/cocina` y `/menu`, usar la hamburguesa y la bottom bar para navegar.

**Acceptance Scenarios**:

1. **Given** cualquier rol autenticado, **When** se abre el drawer,
   **Then** muestra perfil (nombre + rol), links activos en verde
   primario y "Cerrar sesión".
2. **Given** caja o cliente en móvil, **When** hay carrito/pedidos listos,
   **Then** la bottom bar muestra 2 pestañas con badge de contador.
3. **Given** escritorio, **When** se carga el layout, **Then** el listado
   del drawer queda como panel lateral fijo de 16rem.

---

### User Story 2 - Entrega de pedidos listos desde caja (Priority: P1)

Como cajero, quiero ver los pedidos `Listo` (anticipados y de mostrador) y
marcarlos **Entregados** en un toque, para completar el flujo
`Pagado → En preparación → Listo → Entregado` (FR-016).

**Why this priority**: hoy el estado `Listo` no tiene salida: el flujo se
rompe y la cocina deja pedidos sin recoger. Es la única pieza del MVP que
requiere endpoints nuevos (el resto es solo frontend).

**Independent Test**: con un pedido `Listo` en BD, abrir `/caja/entregas`,
entregarlo y verificar `Listo → Entregado` en BD y desaparición de la fila.

**Acceptance Scenarios**:

1. **Given** pedidos `Listo` de ambos orígenes, **When** se consulta
   `GET /api/counter/orders/ready`, **Then** los lista ordenados por
   llegada con partidas y cliente.
2. **Given** un pedido `Listo`, **When** cajero llama
   `POST /api/counter/orders/:id/deliver`, **Then** pasa a `Entregado`.
3. **Given** un pedido `Pagado` (sin estar Listo), **When** se intenta
   entregar, **Then** responde `409`.
4. **Given** un alumno o cocinero, **When** llama los endpoints de
   entrega, **Then** responde `403`.

---

### User Story 3 - Captura de caja en 3 pantallas (Priority: P1)

Como cajero, quiero capturar un pedido (catálogo con búsqueda/categorías y
steppers ≥44 px), revisar el resumen y cobrar en un solo paso (FR-015,
SC-S4-01), para no perder tiempo en el receso.

**Acceptance Scenarios**:

1. **Given** el menú de hoy, **When** se busca "café", **Then** solo
   aparecen platillos que contengan el texto.
2. **Given** un carrito no vacío, **When** se está en el catálogo, **Then**
   la barra flotante muestra N platillos + total + "Ver cobro".
3. **Given** el resumen, **When** se pulsa "Registrar y cobrar", **Then**
   se cobra en un solo paso (sin pasos extra de método de pago).

---

### User Story 4 - Admin con landing de acciones rápidas (Priority: P2)

Como administrador, quiero una landing en `/admin` con tarjetas de acceso
rápido (Usuarios, Platillos, Menú del día, Reportes) y el drawer con
"Reportes", para llegar a cualquier sección sin recordar URLs.

**Acceptance Scenarios**:

1. **Given** `/admin`, **When** se carga, **Then** muestra fecha y 4
   tarjetas enlazando a cada sección.
2. **Given** el drawer del admin, **When** se lista, **Then** incluye
   Usuarios, Platillos, Menú del día y Reportes.

---

### User Story 5 - KDS con folio grande, cliente y sondeo de 4 s (Priority: P2)

Como cocinero, quiero tarjetas con folio grande, origen, cliente, hora de
recolección y "¡Retrasado!" cuando ya pasó, con sondeo cada 4 s y feedback
"act. hace X s", para no perder pedidos en el receso.

**Acceptance Scenarios**:

1. **Given** la cola de cocina, **When** se renderiza, **Then** cada
   tarjeta muestra folio ≥20 px peso 800, chip de origen y partidas N×.
2. **Given** un pedido con hora de recolección pasada, **When** se
   renderiza, **Then** muestra "¡Retrasado!" en color error.
3. **Given** la pantalla, **When** pasa 1 s, **Then** el indicador de
   sondeo muestra "act. hace N s".

---

### User Story 6 - Menú de cliente con búsqueda, categorías y aviso "Listo"
(Priority: P2)

Como alumno/docente, quiero buscar y filtrar por categoría en el menú, y
ver el aviso "¡Listo para recoger!" en mis pedidos, para encontrar lo que
quiero y saber cuándo recoger.

**Acceptance Scenarios**:

1. **Given** el menú con platillos de varias categorías, **When** se toca
   un chip de categoría, **Then** solo se muestran los de esa categoría.
2. **Given** un pedido `Listo`, **When** aparece en `/mis-pedidos`,
   **Then** lleva aviso destacado con borde `status-ready`.

---

### Edge Cases

- **Drawer en escritorio**: se muestra fijo; la hamburguesa no aplica.
- **Pedido cancelado mientras caja lo lista en Entregas**: `deliver`
  responde `409` y la fila se recarga (patrón de conflicto de cocina).
- **Dos cajeros entregando a la vez**: el segundo recibe `409`
  (transición ya aplicada), sin bloqueos pesados.
- **Categorías sin platillos en el menú de hoy**: el chip no se muestra
  (chips derivados del catálogo real, no inventados).
- **Fallo de red en el sondeo de cocina**: 2 fallos consecutivos →
  "Sin conexión — reintentando…" sin bloquear la vista.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Los 4 layouts (admin, caja, cocina, cliente) MUST usar un
  `RoleNavDrawer` compartido (perfil + links + logout; panel lateral fijo
  en escritorio).
- **FR-002**: Caja (móvil) y cliente (móvil) MUST usar `BottomBar` con 2
  pestañas y badge de contador (≥56 px de alto, targets ≥44 px).
- **FR-003**: El backend MUST exponer `GET /api/counter/orders/ready`
  (rol `cajero`) con pedidos `Listo` de ambos orígenes, ordenados por
  llegada, con partidas, cliente y totales.
- **FR-004**: El backend MUST exponer `POST /api/counter/orders/:id/deliver`
  (rol `cajero`) que aplica `Listo → Entregado` vía `transitionOrder`
  (409 en cualquier otro estado).
- **FR-005**: `/admin` MUST ser una landing con fecha y 4 tarjetas de
  acción rápida (Usuarios, Platillos, Menú del día, Reportes); Usuarios se
  mantiene accesible en `/admin/usuarios`.
- **FR-006**: `/caja` MUST dividirse en landing (`/caja`), catálogo
  (`/caja/capturar`), resumen (`/caja/cobro`) y entregas
  (`/caja/entregas`); el cobro sigue en un solo paso (FR-015 de 001).
- **FR-007**: El catálogo de caja y el menú de cliente MUST tener buscador
  en vivo y chips de categoría derivados del catálogo real.
- **FR-008**: Los steppers de cantidad (caja y cliente) MUST tener botones
  de ≥44 px (FR-020).
- **FR-009**: La tarjeta de cocina MUST mostrar folio grande, chip de
  origen, cliente, hora de registro/recolección, "¡Retrasado!" cuando
  aplique, partidas N× y CTA único de 48 px.
- **FR-010**: El sondeo de cocina MUST ser cada 4 s con indicador
  "act. hace X s" y estado "Sin conexión" tras 2 fallos.
- **FR-011**: `/mis-pedidos` y el detalle del pedido MUST resaltar los
  pedidos `Listo` con el aviso "¡Listo para recoger!".
- **FR-012**: Toda la UI MUST respetar los tokens de
  `.stitch/DESIGN.md`/`index.css` (sin `amber-`, `stone-`, `bg-red-`,
  `bg-green-`) y usar `StatusBadge` para estados.

### Key Entities

- **Pedido Listo para entrega**: `pedidos` en estado `Listo` + número,
  tipo origen, partidas, cliente, `creado_en`, hora de recolección.
- **Pedido entregado**: transición `Listo → Entregado` registrada en
  `transicion_estado` con actor cajero.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Backend en verde: `npm test` (≥ suites existentes + nuevas
  de ready/deliver), `npm run typecheck`, `npm run build`.
- **SC-002**: Frontend en verde: `npm run lint`, `npm run build`.
- **SC-003**: `GET /api/counter/orders/ready` y
  `POST /api/counter/orders/:id/deliver` verificados (200/409/403) como
  en los quickstarts previos.
- **SC-004**: Checklists de `design/diseño-operativo.md`,
  `diseño-cocina.md` y `diseño-cliente.md` cumplidos (44 px, badges pill,
  estados vacío/error, tokens).
- **SC-005**: 0 ocurrencias de `amber-`, `stone-`, `bg-red-`, `bg-green-`
  en `frontend/src/**`.

## Assumptions

- La entrega es la única adición de backend; el resto son cambios de
  presentación sobre endpoints existentes.
- Las imágenes de platillo, push, historial de ventas, métricas de negocio,
  sonido en cocina, descuentos y métodos de pago con tarjeta siguen
  **fuera de alcance** (§27).
- `diseño-*.md` es la fuente de verdad de diseño; ante conflicto con el
  código actual, manda el documento corregido.
