# Feature Specification: Base de Diseño UI (tokens, shadcn/ui y migración)

**Feature Branch**: `007-ui-foundation`

**Created**: 2026-10-13

**Status**: Draft

**Input**: Pulido de UI según `.stitch/DESIGN.md` (previsto originalmente en el
Sprint 5 — `docs/sprints.md`), adelantado como base del Sprint 4. Derivada de
`docs/reglas.md` §2 (Tailwind + shadcn/ui) y §19 (Interfaz de usuario).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interfaz consistente con la identidad de la cafetería
(Priority: P1)

Como patrocinadora/usuario del sistema, quiero que todas las pantallas usen la
paleta, tipografía y componentes definidos en DESIGN.md (verde institucional
para acciones, crema de fondo, Plus Jakarta Sans en títulos), para que la
aplicación se vea institucional y sea legible en el receso.

**Why this priority**: sin tokens ni componentes base, cada pantalla inventa su
propio estilo (hoy todo es ámbar/stone); el Sprint 4 construiría caja/cocina
sobre esa inconsistencia.

**Independent Test**: abrir `/login`, `/menu`, `/admin` y `/cart` y verificar
fondo crema, botones verdes, títulos en Plus Jakarta Sans y badges de estado
con color sólido.

**Acceptance Scenarios**:

1. **Given** la app en cualquier ruta, **When** se renderiza, **Then** el
   fondo es Warm Cream `#F6F1E9` y las acciones primarias son verdes
   `#1E7A46`.
2. **Given** un formulario, **When** el input recibe foco, **Then** el borde
   de foco es verde de 2 px con etiqueta visible y error en línea.
3. **Given** un pedido en cualquier estado, **When** se muestra su badge,
   **Then** usa el color de estado de DESIGN.md con texto blanco (pill).

---

### User Story 2 - Componentes base reutilizables (Priority: P1)

Como desarrollador, quiero los componentes de shadcn/ui (button, card, input,
label, badge, dialog) instalados y personalizados con los tokens del proyecto,
para que el Sprint 4 (caja/cocina) los use desde su primera tarea.

**Why this priority**: `docs/reglas.md` §2 exige shadcn/ui con tokens del
proyecto; es prerequisito de las pantallas nuevas.

**Independent Test**: `frontend/src/components/ui/` existe con los
componentes, compila con `tsc -b` y las pantallas existentes los consumen.

**Acceptance Scenarios**:

1. **Given** el proyecto, **When** se ejecuta `npm run build` en frontend,
   **Then** compila sin errores usando los componentes de `components/ui/`.
2. **Given** un botón deshabilitado, **When** se renderiza, **Then** mantiene
   contraste legible (reglas §19).

---

### Edge Cases

- Conflictos de nombres entre utilidades Tailwind y tokens: resolver a favor
  del token de DESIGN.md.
- Clases hardcodeadas restantes tras la migración: SHOULD quedar en cero
  (`amber-*`, `stone-*` como fondo, `red-*/green-100` de estado).
- Placeholders de `/caja`, `/cocina`, `/mis-pedidos`: se actualiza solo su
  estética base; el contenido llega en sus sprints.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El frontend MUST exponer los colores, tipografía, radios y
  espaciado de `.stitch/DESIGN.md` como tokens de Tailwind v4 (`@theme` en
  `index.css`).
- **FR-002**: El frontend MUST cargar Plus Jakarta Sans (700/800) e Inter
  (400/500/600) desde `index.html`.
- **FR-003**: El proyecto MUST incluir shadcn/ui inicializado con componentes
  base en `frontend/src/components/ui/` (button, card, input, label, badge,
  dialog) personalizados con los tokens.
- **FR-004**: Un componente `StatusBadge` MUST mapear los 6 estados de pedido
  (Pendiente, Pagado, En preparación, Listo, Entregado, Cancelado) al color
  de estado de DESIGN.md con texto blanco.
- **FR-005**: Todas las pantallas existentes (login/registro, admin,
  menú, carrito, checkout, confirmación) MUST migrar sus clases
  `amber/stone/red/green` a tokens y componentes base.
- **FR-006**: Los botones interactivos MUST tener área táctil ≥ 44 px y los
  focos de input MUST ser verdes de 2 px (reglas §19).

### Key Entities

- **Token de diseño**: variable CSS/utilidad Tailwind derivada de DESIGN.md.
- **Componente base**: componente shadcn copiado al proyecto y personalizado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npm run typecheck`, `npm run build` y `npm run lint` en verde
  en `frontend/`.
- **SC-002**: Cero ocurrencias de `bg-amber-*`/`bg-stone-50` como acción o
  fondo en `frontend/src/**/*.tsx` tras la migración.
- **SC-003**: El 100 % de las pantallas existentes usa `StatusBadge` para
  estados de pedido y los colores de DESIGN.md para acciones primarias.

## Assumptions

- Los diseños de Stitch son base de referencia, no obligatorios al 100 %
  (`docs/reglas.md` §2); este respeto la paleta y tipografía tal cual.
- shadcn/ui se instala con sus deps (Radix, clsx, tailwind-merge, cva) —
  copia de componentes al repo, sin dependencia en runtime del CLI.
- No se crean pantallas nuevas ni se mueven rutas.
