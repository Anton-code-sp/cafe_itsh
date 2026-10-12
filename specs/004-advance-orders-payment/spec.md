# Feature Specification: Pedido Anticipado y Pago

**Feature Branch**: `004-advance-orders-payment`

**Created**: 2026-10-11

**Status**: Draft

**Input**: Sprint 3 de `docs/sprints.md`; derivada de la spec maestra
`specs/001-advance-order-system/spec.md` (US2).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Realizar un pedido anticipado con pago (Priority: P1)

Como alumno o docente, quiero seleccionar platillos del menú, ver el total,
pagar por adelantado y confirmar mi pedido con al menos 10 minutos de
anticipación, para recogerlo sin hacer fila en el receso.

**Why this priority**: Es el objetivo central del proyecto: reducir el tiempo
de espera en caja y los errores de comunicación verbal.

**Independent Test**: Puede probarse completamente seleccionando platillos,
revisando el total, realizando el pago y recibiendo la confirmación del
pedido, sin intervención de cajero ni cocinero.

**Acceptance Scenarios**:

1. **Given** el menú del día está disponible, **When** el usuario selecciona
   uno o más platillos con sus cantidades en `/menu`, **Then** ve el total
   antes de confirmar.
2. **Given** la hora actual permite pedir con al menos 10 minutos de
   anticipación, **When** el usuario confirma y paga, **Then** el pedido queda
   registrado con folio y pasa a estado Pagado al confirmarse el pago.
3. **Given** la hora actual deja menos de 10 minutos para el corte, **When**
   el usuario intenta crear el pedido, **Then** el sistema impide la creación y
   explica el motivo con un mensaje claro.
4. **Given** un platillo está no disponible, **When** el usuario intenta
   incluirlo, **Then** el sistema impide incluirlo en el pedido.
5. **Given** el pago no se confirma, **When** el usuario intenta finalizar,
   **Then** el pedido no se considera pagado y se informa el resultado del pago
   sin exponer detalles internos.
6. **Given** un pedido confirmado, **When** el usuario consulta la confirmación
   de su pedido, **Then** aparece con su folio, platillos, cantidades, total y
   estado Pagado.

---

### Edge Cases

- El menú cambia mientras el usuario tiene un carrito: el sistema MUST
  recalcular con los platillos disponibles al confirmar y MUST impedir confirmar
  con platillos no disponibles.
- El pago del proveedor externo falla o queda pendiente: el pedido MUST quedar
  sin estado Pagado y el usuario MUST recibir un mensaje claro.
- El usuario paga pero el navegador se desconecta: al volver, la confirmación
  del pedido MUST poder recuperarse con el folio o su sesión.
- Dos pedidos simultáneos del mismo usuario: cada uno MUST generar folio y
  total independientes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST crear las tablas `pedidos`, `detalle_pedidos` y
  `pagos` mediante migraciones, con estados iniciales `Pendiente` y `Pagado`.
- **FR-002**: El sistema MUST permitir seleccionar uno o más platillos con sus
  cantidades y MUST mostrar el total antes de confirmar (spec maestra FR-008).
- **FR-003**: El sistema MUST aceptar pedidos anticipados sólo cuando falten
  al menos 10 minutos y MUST rechazar los que no cumplan ese mínimo (spec
  maestra FR-009).
- **FR-004**: El sistema MUST impedir crear pedidos que incluyan platillos no
  disponibles o datos inválidos o incompletos (spec maestra FR-010).
- **FR-005**: El pago MUST formar parte del flujo del pedido; un pedido
  anticipado pasa a estado Pagado cuando el pago se confirma (spec maestra
  FR-011).
- **FR-006**: El sistema MUST procesar el pago en línea mediante un servicio
  de pago externo (spec maestra FR-012) y MUST NOT almacenar información
  sensible de tarjetas (spec maestra FR-013).
- **FR-007**: Ante un pago no confirmado, el sistema MUST mantener el pedido
  sin estado Pagado y MUST informar el resultado con un mensaje claro (spec
  maestra FR-014).
- **FR-008**: Todo pedido MUST mantener en todo momento un estado (spec
  maestra FR-015); en este sprint los estados soportados son `Pendiente`,
  `Pagado` y `Cancelado`.
- **FR-009**: Un pedido pagado MUST quedar visible para cocina en estado
  Pagado (el módulo de cocina se implementa en el sprint siguiente).

### Key Entities

- **Pedido**: solicitud con folio, origen anticipado, total, estado actual y
  dueño (usuario).
- **Detalle de pedido**: relación pedido-platillo con cantidad y precio
  aplicado.
- **Pago**: registro de la transacción con la información mínima para
  identificarla y validarla (sin datos sensibles de tarjeta).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El **100 % de los pedidos anticipados** se crea con al menos **10
  minutos de anticipación**; ninguno se admite fuera de esa ventana (spec
  maestra SC-002).
- **SC-002**: El **100 % de los pedidos Pagados** tienen un registro de pago
  asociado identificable.
- **SC-003**: Un alumno puede completar el flujo menú → selección → pago →
  confirmación en menos de **5 minutos** de su tiempo activo (spec maestra
  SC-004 parcial).

## Assumptions

- Hereda las suposiciones de la spec maestra 001, incluida la ventana de 10
  minutos calculada contra la hora de corte de atención.
- El proveedor de pago externo se define en `PAYMENT_API_KEY`/variables de
  entorno; para desarrollo se usa un adaptador de prueba.
- La lista completa de "mis pedidos" con seguimiento es del sprint 5; aquí se
  entrega la confirmación del pedido creado.
