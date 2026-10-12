# Feature Specification: Gestión de Menú y Consulta de Menú

**Feature Branch**: `003-menu-management`

**Created**: 2026-10-11

**Status**: Draft

**Input**: Sprint 2 de `docs/sprints.md`; derivada de la spec maestra
`specs/001-advance-order-system/spec.md` (US7 + US1).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar el menú del día (Priority: P1)

Como alumno o docente, quiero ver el menú del día con platillos, precios,
disponibilidad y especiales del día desde mi teléfono o computadora, para
saber qué se vende hoy sin hacer fila ni preguntar al personal.

**Why this priority**: Es la base sobre la que se construye cualquier pedido y
entrega valor de inmediato: elimina la consulta verbal en mostrador.

**Independent Test**: Puede probarse abriendo el menú en móvil y escritorio en
horario de receso y verificando platillos, precios, especiales y disponibilidad.

**Acceptance Scenarios**:

1. **Given** el menú del día tiene platillos publicados, **When** un alumno o
   docente abre `/menu`, **Then** ve cada platillo con nombre, precio y
   disponibilidad, incluyendo los especiales del día.
2. **Given** un platillo está marcado como no disponible, **When** se consulta
   el menú, **Then** aparece identificado como no disponible y no es
   seleccionable.
3. **Given** varios usuarios consultan el menú en horario de receso, **When**
   abren la consulta, **Then** ven el menú vigente sin esperas perceptibles.
4. **Given** el administrador modificó un precio o la disponibilidad, **When**
   el usuario vuelve a consultar el menú, **Then** los cambios se reflejan de
   inmediato.

---

### User Story 2 - Gestionar menú, platillos y precios (Priority: P2)

Como administrador, quiero crear y modificar el menú diario, gestionar
platillos, especiales del día, precios y disponibilidad, para que el menú
refleje lo que realmente se vende cada día.

**Why this priority**: Es administración de contenido; sin ella el menú no se
puede sostener día a día. En la spec maestra es US7 (P3); en este sprint es
habilitadora de la US1.

**Independent Test**: Puede probarse creando un platillo, publicándolo en el
menú del día, cambiando su precio y marcándolo no disponible, verificando el
efecto en `/menu`.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado en `/admin`, **When** crea o edita
   un platillo con precio, **Then** el platillo queda disponible para el menú
   del día.
2. **Given** un platillo marcado no disponible, **When** un alumno consulta el
   menú, **Then** no puede seleccionarlo.
3. **Given** un cambio de precio, **When** el usuario consulta el menú,
   **Then** ve el precio vigente.
4. **Given** un platillo sin datos válidos (nombre o precio vacíos), **When**
   se intenta guardarlo, **Then** el sistema muestra un mensaje claro y no lo
   almacena.

---

### Edge Cases

- El admin deshabilita el último platillo del menú: el menú del día queda
  vacío y `/menu` MUST mostrar un estado vacío comprensible.
- Dos administradores editan el mismo platillo: prevalece la última escritura
  registrada (sin control optimista en el MVP).
- Un platillo se deshabilita durante el receso: los usuarios en curso MUST ver
  el cambio sin recargar de forma forzosa (la recarga manual o el refresco
  periódico es aceptable en el MVP).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST crear las tablas `platillos`, `menu_del_dia` y
  la relación de especiales del día mediante migraciones.
- **FR-002**: El administrador MUST poder crear y modificar el menú diario,
  gestionar platillos, gestionar especiales del día y asignar o modificar
  precios (spec maestra FR-005).
- **FR-003**: El administrador MUST poder marcar platillos como no
  disponibles; los platillos no disponibles MUST NOT poder seleccionarse en
  nuevos pedidos (spec maestra FR-006).
- **FR-004**: El sistema MUST mostrar a alumnos y docentes el menú del día con
  platillos, precios, disponibilidad y especiales del día (spec maestra
  FR-004).
- **FR-005**: Los cambios de menú, precios o disponibilidad MUST reflejarse de
  inmediato para los usuarios finales (spec maestra FR-007).
- **FR-006**: La consulta del menú MUST ser rápida en horario de receso, en
  móvil y escritorio (spec maestra FR-024 y FR-025 aplicadas al módulo).

### Key Entities

- **Platillo**: producto del menú con nombre, descripción corta, precio y
  disponibilidad.
- **Menú del día**: conjunto de platillos publicados para un día.
- **Especial del día**: platillo destacado del menú del día.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El admin puede publicar el menú del día completo en menos de
  10 minutos con la interfaz de `/admin`.
- **SC-002**: Un alumno puede consultar el menú en su teléfono en menos de 5
  segundos desde que abre `/menu`.
- **SC-003**: El 100 % de los platillos no disponibles aparecen identificados y
  no seleccionables.

## Assumptions

- Hereda las suposiciones de la spec maestra 001.
- El menú del día es diario y el admin lo publica antes del primer receso.
- La consulta del menú no requiere autenticación de pago ni carrito (eso es
  del sprint 3).
- Los precios se manejan en la moneda local del plantel.
