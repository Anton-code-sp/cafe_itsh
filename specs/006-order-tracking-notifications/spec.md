# Feature Specification: Seguimiento de Pedidos y Notificaciones

**Feature Branch**: `006-order-tracking-notifications`

**Created**: 2026-10-11

**Status**: Draft

**Input**: Sprint 5 de `docs/sprints.md`; derivada de la spec maestra
`specs/001-advance-order-system/spec.md` (US5 + pulido del MVP).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seguir el estado de mis pedidos y recibir aviso (Priority: P1)

Como alumno o docente, quiero ver la lista de mis pedidos con su estado actual
y recibir una notificación cuando mi pedido esté Listo, para recogerlo en el
momento indicado.

**Why this priority**: Completa el valor percibido por el usuario final: sin
estado y aviso, el usuario no sabe cuándo recoger y reaparece la consulta
verbal en mostrador.

**Independent Test**: Puede probarse realizando un pedido, llevándolo por sus
estados hasta Listo y verificando que el usuario ve el cambio de estado y
recibe el aviso de pedido listo.

**Acceptance Scenarios**:

1. **Given** un usuario con pedidos, **When** consulta `/mis-pedidos`, **Then**
   ve la lista con el estado actual y el detalle de cada uno (platillos,
   cantidades, total, folio).
2. **Given** un pedido pasa a Listo, **When** se dispara la notificación,
   **Then** el alumno o docente recibe el aviso de que ya puede recogerlo.
3. **Given** un pedido Cancelado, **When** el usuario lo consulta, **Then** ve
   el estado Cancelado sin notificación de pedido listo.
4. **Given** un pedido Entregado o Cancelado, **When** se intenta un nuevo
   cambio de estado, **Then** el sistema lo rechaza.

---

### User Story 2 - Cierre del MVP: pulido y demo (Priority: P2)

Como equipo del proyecto, quiero cerrar el MVP con la interfaz pulida, las
pruebas críticas en verde y el flujo completo demostrable, para presentarlo
ante la patrocinadora.

**Why this priority**: La aceptación final depende de una demostración funcional
y de la validación de la patrocinadora (spec maestra §29).

**Independent Test**: Puede probarse ejecutando la demo completa del flujo de
aceptación y la suite de pruebas sin errores.

**Acceptance Scenarios**:

1. **Given** el sistema completo, **When** se ejecuta el flujo menú →
   selección → pedido → pago → cocina → preparación → listo → notificación →
   recogida, **Then** se completa sin intervención fuera del sistema.
2. **Given** la suite de pruebas, **When** se ejecuta `npm test`, **Then**
   las pruebas críticas (pagos, estados, permisos) pasan.
3. **Given** la interfaz, **When** se revisa contra el DESIGN.md, **Then** los
   componentes siguen los tokens del proyecto (colores, tipografía, áreas
   táctiles ≥44 px en caja y cocina).

---

### Edge Cases

- Fallo del servicio de notificación: el estado del pedido MUST seguir siendo
  visible en `/mis-pedidos` (el aviso es complemento, no sustituto).
- Varias notificaciones simultáneas: cada aviso MUST identificar el folio del
  pedido correspondiente.
- Usuario sin pedidos: `/mis-pedidos` MUST mostrar un estado vacío claro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El alumno o docente MUST poder consultar la lista de sus pedidos
  con el estado actual y el detalle (platillos, cantidades, total) (spec
  maestra FR-018).
- **FR-002**: Cuando un pedido pasa a Listo, el sistema MUST notificar al
  alumno o docente que su pedido está listo para recoger (spec maestra
  FR-022).
- **FR-003**: La funcionalidad de notificaciones MUST mantenerse separada de
  la lógica principal de pedidos y MAY apoyarse en un servicio externo (spec
  maestra FR-023); en el MVP se entrega al menos notificación dentro de la
  aplicación.
- **FR-004**: El flujo completo de estados (Pendiente → Pagado → En
  preparación → Listo → Entregado, más Cancelado) MUST estar operativo de
  punta a punta (spec maestra FR-016 y FR-017).
- **FR-005**: El **100 % de los pedidos que llegan a Listo** MUST generar el
  aviso al usuario correspondiente (spec maestra SC-006).
- **FR-006**: Las funcionalidades críticas (pagos, estados de pedido, permisos)
  MUST contar con pruebas antes de considerarse completas (spec maestra
  §20).

### Key Entities

- **Notificación**: aviso enviado al usuario cuando su pedido está Listo, con
  folio y estado del pedido; almacenada/derivada por el módulo de
  notificaciones separado de la lógica de pedidos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El **100 % de los pedidos que llegan a Listo** genera el aviso al
  usuario correspondiente (spec maestra SC-006).
- **SC-002**: Un alumno o docente completa el flujo completo (menú → selección
  → pedido → pago → aviso de pedido listo → recogida) sin asistencia del
  personal y en menos de **5 minutos** de su tiempo activo (spec maestra
  SC-004).
- **SC-003**: La demo final ante la patrocinadora cubre el flujo de aceptación
  completo sin errores (spec maestra SC-008).

## Assumptions

- Hereda las suposiciones de la spec maestra 001.
- En el MVP la notificación es dentro de la aplicación (polling/refresh);
  el servicio externo (ej. correo o mensajería) es opcional si está disponible.
- Este sprint cierra el alcance del MVP; cualquier funcionalidad nueva requiere
  aprobación previa (constitución, principio I).
