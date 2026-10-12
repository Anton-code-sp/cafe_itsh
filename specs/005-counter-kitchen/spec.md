# Feature Specification: Mostrador (Cajero) y Cocina

**Feature Branch**: `005-counter-kitchen`

**Created**: 2026-10-11

**Status**: Draft

**Input**: Sprint 4 de `docs/sprints.md`; derivada de la spec maestra
`specs/001-advance-order-system/spec.md` (US3 + US4).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Atender pedidos de mostrador (Priority: P1)

Como cajero, quiero capturar los pedidos que llegan presencialmente y
registrar su cobro con la menor cantidad de pasos posible, para que la fila de
mostrador siga atendiéndose mientras operan los pedidos anticipados.

**Why this priority**: El proyecto no debe interrumpir el servicio actual de
mostrador; el sistema debe convivir con la operación existente.

**Independent Test**: Puede probarse capturando un pedido presencial,
registrando su cobro y verificando que el pedido anticipado en curso no se ve
afectado, todo durante el receso.

**Acceptance Scenarios**:

1. **Given** un cliente solicita pedido en mostrador, **When** el cajero lo
   captura en `/caja` y registra el cobro, **Then** el pedido queda en el
   sistema como Pagado con su folio y total.
2. **Given** existen pedidos anticipados activos, **When** el cajero captura
   un pedido de mostrador, **Then** ambos flujos operan de forma simultánea
   sin interferirse.
3. **Given** un pedido de mostrador con datos incompletos o inválidos, **When**
   el cajero intenta guardarlo, **Then** el sistema muestra un mensaje claro y
   no almacena el pedido inválido.

---

### User Story 2 - Preparar pedidos en cocina (Priority: P1)

Como cocinero, quiero ver en una sola pantalla los pedidos entrantes
(anticipados y de mostrador) con sus productos, cantidades y orden de
preparación, y poder marcarlos como En preparación y Listo, para saber siempre
qué cocinar y en qué orden.

**Why this priority**: Sin visibilidad de cocina el pedido anticipado no llega
a completarse; cierra el flujo operativo junto con la historia anterior.

**Independent Test**: Puede probarse con pedidos anticipados y de mostrador
existentes, verificando que aparecen en `/cocina` y que el cocinero puede
cambiar su estado.

**Acceptance Scenarios**:

1. **Given** pedidos con estado Pagado (anticipados y de mostrador), **When**
   el cocinero abre `/cocina`, **Then** los ve ordenados por orden de
   preparación con productos y cantidades.
2. **Given** un pedido visible en cocina, **When** el cocinero lo marca En
   preparación y luego Listo, **Then** el estado cambia y la lista se
   actualiza sin recargar manualmente.
3. **Given** un pedido en estado Entregado o Cancelado, **When** el cocinero
   intenta cambiarlo, **Then** el cambio no está permitido.
4. **Given** un pedido intenta saltarse estados (por ejemplo Pagado → Listo),
   **When** se intenta el cambio, **Then** el sistema lo rechaza.

---

### Edge Cases

- Cocinero intenta saltarse estados o modificar Entregado/Cancelado: el
  sistema MUST rechazar la transición con mensaje claro.
- Muchos pedidos simultáneos en receso: la pantalla de cocina MUST mostrar el
  orden de preparación de forma inequívoca (folio y tiempo de llegada).
- Cajero y pedidos anticipados operan a la vez: ningún flujo MUST bloquear al
  otro.
- Un pedido anticipado se marca Listo antes de que exista el módulo de
  notificaciones (sprint 5): el estado MUST quedar registrado aunque el aviso
  aún no se envíe.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST soportar los estados completos `Pendiente`,
  `Pagado`, `En preparación`, `Listo`, `Entregado` y `Cancelado` (spec
  maestra FR-015).
- **FR-002**: El flujo de estados válido MUST ser Pendiente → Pagado → En
  preparación → Listo → Entregado, y un pedido MAY pasar a Cancelado antes de
  ser entregado (spec maestra FR-016); los pedidos de mostrador se crean
  directamente en Pagado al registrar el cobro.
- **FR-003**: El sistema MUST rechazar transiciones que salten estados y MUST
  impedir cambiar pedidos en estado Entregado o Cancelado (spec maestra
  FR-017).
- **FR-004**: El cajero MUST poder capturar pedidos presenciales y registrar
  y gestionar su cobro con la menor cantidad de pasos posible (spec maestra
  FR-019).
- **FR-005**: El sistema MUST mostrar en una sola pantalla los pedidos
  entrantes (anticipados y de mostrador) con productos, cantidades y orden de
  preparación, actualizándose sin recarga manual (spec maestra FR-020).
- **FR-006**: El cocinero MUST poder cambiar el estado de un pedido a En
  preparación y a Listo (spec maestra FR-021).
- **FR-007**: El sistema MUST operar simultáneamente pedidos anticipados y de
  mostrador sin que un flujo interrumpa al otro (spec maestra FR-003).

### Key Entities

- **Pedido**: hereda la entidad del sprint 3; se agrega el origen
  (anticipado/mostrador) y la marca temporal de llegada a cocina.
- **Estado de pedido**: valor del pedido dentro del flujo completo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cajero captura y cobra un pedido de mostrador en menos de **2
  minutos**.
- **SC-002**: Durante un receso de alta demanda, cajeros y cocineros operan sus
  tareas sin que los pedidos anticipados bloqueen el flujo de mostrador (spec
  maestra SC-007).
- **SC-003**: El **100 % de los pedidos** en cocina muestra su orden de
  preparación de forma inequívoca (spec maestra SC-005).

## Assumptions

- Hereda las suposiciones de la spec maestra 001.
- La actualización sin recarga manual puede resolverse con refresco periódico
  (polling) en el MVP; WebSockets son opcionales.
- El cobro de mostrador se registra en el sistema; la impresión de tickets NO
  está en el alcance del MVP.
