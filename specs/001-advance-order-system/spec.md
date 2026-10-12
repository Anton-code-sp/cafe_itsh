# Feature Specification: Sistema de Pedidos Anticipados — Cafetería ITSH

**Feature Branch**: `001-advance-order-system`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "docs/spec-input.md — Sistema web de pedidos anticipados para la Cafetería ITSH: consulta de menú, pedidos y pagos por adelantado, notificación de pedido listo, sin interrumpir el servicio de mostrador."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar el menú del día (Priority: P1)

Como alumno o docente, quiero ver el menú del día con platillos, precios,
disponibilidad y especiales del día desde mi teléfono o computadora, para
saber qué se vende hoy sin hacer fila ni preguntar al personal.

**Why this priority**: Es la base sobre la que se construye cualquier pedido y
entrega valor de inmediato: elimina la consulta verbal en mostrador. Sin menú
visible no existe el pedido anticipado.

**Independent Test**: Puede probarse completamente abriendo el menú en un
dispositivo móvil y una computadora en horario de receso, verificando que los
platillos, precios, especiales del día y estados de disponibilidad se muestran
correctamente.

**Acceptance Scenarios**:

1. **Given** el menú del día tiene platillos publicados, **When** un alumno o
   docente abre la consulta de menú, **Then** ve cada platillo con su nombre,
   precio y disponibilidad, incluyendo los especiales del día.
2. **Given** un platillo está marcado como no disponible, **When** se consulta
   el menú, **Then** el platillo aparece identificado como no disponible.
3. **Given** varios usuarios consultan el menú en horario de receso, **When**
   abren la consulta, **Then** ven el menú vigente sin esperas perceptibles.
4. **Given** el administrador modificó un precio o la disponibilidad,
   **When** el usuario vuelve a consultar el menú, **Then** los cambios se
   reflejan de inmediato.

---

### User Story 2 - Realizar un pedido anticipado con pago (Priority: P1)

Como alumno o docente, quiero seleccionar platillos del menú, ver el total,
pagar por adelantado y confirmar mi pedido con al menos 10 minutos de
anticipación, para recogerlo sin hacer fila en el receso.

**Why this priority**: Es el objetivo central del proyecto: reducir el tiempo
de espera en caja y los errores de comunicación verbal. Es la historia que
genera el beneficio de negocio medible.

**Independent Test**: Puede probarse completamente seleccionando platillos,
revisando el total, realizando el pago y recibiendo la confirmación del
pedido, sin intervención de cajero ni cocinero.

**Acceptance Scenarios**:

1. **Given** el menú del día está disponible, **When** el usuario selecciona
   uno o más platillos con sus cantidades, **Then** ve el total antes de
   confirmar.
2. **Given** la hora actual permite pedir con al menos 10 minutos de
   anticipación, **When** el usuario confirma y paga, **Then** el pedido queda
   registrado y pasa a estado Pagado al confirmarse el pago.
3. **Given** la hora actual deja menos de 10 minutos para el corte,
   **When** el usuario intenta crear el pedido, **Then** el sistema impide la
   creación y explica el motivo con un mensaje claro.
4. **Given** un platillo está no disponible, **When** el usuario intenta
   incluirlo, **Then** el sistema impide incluirlo en el pedido.
5. **Given** el pago no se confirma, **When** el usuario intenta finalizar,
   **Then** el pedido no se considera pagado y se informa el resultado del
   pago sin exponer detalles internos.
6. **Given** un pedido confirmado, **When** el usuario consulta su pedido,
   **Then** aparece con sus platillos, cantidades, total y estado.

---

### User Story 3 - Atender pedidos de mostrador (Priority: P2)

Como cajero, quiero capturar los pedidos que llegan presencialmente y
registrar su cobro con la menor cantidad de pasos posible, para que la fila
de mostrador siga atendiéndose mientras operan los pedidos anticipados.

**Why this priority**: El proyecto no debe interrumpir el servicio actual de
mostrador; el sistema debe convivir con la operación existente. Tiene
prioridad P2 porque puede validarse con el flujo básico de captura y cobro.

**Independent Test**: Puede probarse capturando un pedido presencial,
registrando su cobro y verificando que el pedido anticipado en curso no se ve
afectado, todo durante el receso.

**Acceptance Scenarios**:

1. **Given** un cliente solicita pedido en mostrador, **When** el cajero lo
   captura y registra el cobro, **Then** el pedido queda en el sistema con su
   estado y total.
2. **Given** existen pedidos anticipados activos, **When** el cajero captura
   un pedido de mostrador, **Then** ambos flujos operan de forma simultánea sin
   interferirse.
3. **Given** un pedido de mostrador con datos incompletos o inválidos,
   **When** el cajero intenta guardarlo, **Then** el sistema muestra un
   mensaje claro y no almacena el pedido inválido.

---

### User Story 4 - Preparar pedidos en cocina (Priority: P2)

Como cocinero, quiero ver en una sola pantalla los pedidos entrantes
(anticipados y de mostrador) con sus productos, cantidades y orden de
preparación, y poder marcarlos como En preparación y Listo, para saber
siempre qué cocinar y en qué orden.

**Why this priority**: Sin visibilidad de cocina el pedido anticipado no llega
a completarse. Va junto con la historia anterior para cerrar el flujo
operativo.

**Independent Test**: Puede probarse con pedidos anticipados y de mostrador
existentes, verificando que aparecen en la pantalla de cocina y que el
cocinero puede cambiar su estado.

**Acceptance Scenarios**:

1. **Given** pedidos con estado Pagado o de mostrador, **When** el cocinero
   abre la pantalla de cocina, **Then** los ve ordenados por orden de
   preparación con productos y cantidades.
2. **Given** un pedido visible en cocina, **When** el cocinero lo marca En
   preparación y luego Listo, **Then** el estado cambia y la lista se
   actualiza sin recargar manualmente.
3. **Given** un pedido en estado Entregado o Cancelado, **When** el cocinero
   intenta cambiarlo, **Then** el cambio no está permitido.
4. **Given** un pedido intenta saltarse estados (por ejemplo Pendiente →
   Listo), **When** se intenta el cambio, **Then** el sistema lo rechaza.

---

### User Story 5 - Seguir el estado de mis pedidos y recibir aviso (Priority: P2)

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

1. **Given** un usuario con pedidos, **When** consulta sus pedidos, **Then**
   ve la lista con el estado actual y el detalle de cada uno.
2. **Given** un pedido pasa a Listo, **When** se dispara la notificación,
   **Then** el alumno o docente recibe el aviso de que ya puede recogerlo.
3. **Given** un pedido Cancelado, **When** el usuario lo consulta, **Then**
   ve el estado Cancelado sin notificación de pedido listo.
4. **Given** un pedido Entregado o Cancelado, **When** se intenta un nuevo
   cambio de estado, **Then** el sistema lo rechaza.

---

### User Story 6 - Gestionar usuarios y roles (Priority: P3)

Como administrador, quiero crear y gestionar a los usuarios operativos
(cajeros y cocineros) y asignar roles, para que cada persona acceda
únicamente a las funciones que le corresponden.

**Why this priority**: Es una condición habilitadora de seguridad y operación;
el sistema puede probarse con cuentas precargadas antes de automatizarla.

**Independent Test**: Puede probarse creando un cajero y un cocinero,
iniciando sesión con cada uno y verificando que cada rol accede sólo a sus
funciones.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** crea un usuario operativo
   con un rol, **Then** el usuario puede iniciar sesión y accede sólo a las
   funciones de ese rol.
2. **Given** un usuario con rol Cocinero, **When** intenta acceder a
   funciones de cajero o administrador, **Then** el acceso le es denegado.
3. **Given** un usuario sin cuenta, **When** intenta iniciar sesión con
   credenciales inválidas, **Then** el sistema muestra un mensaje claro y no
   revela si la cuenta existe.

---

### User Story 7 - Gestionar menú, platillos y precios (Priority: P3)

Como administrador, quiero crear y modificar el menú diario, gestionar
platillos, especiales del día, precios y disponibilidad, para que el menú
refleje lo que realmente se vende cada día.

**Why this priority**: Es administración de contenido; el menú inicial puede
cargarse de forma directa y la gestión automatizada puede llegar después.

**Independent Test**: Puede probarse creando un platillo, publicándolo en el
menú del día, cambiando su precio y marcándolo no disponible, verificando el
efecto en la consulta del menú y en la creación de pedidos.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** crea o edita un platillo
   con precio, **Then** el platillo queda disponible para el menú del día.
2. **Given** un platillo marcado no disponible, **When** un alumno consulta
   el menú e intenta pedir, **Then** no puede seleccionarlo para un nuevo
   pedido.
3. **Given** un cambio de precio, **When** el usuario consulta el menú o
   crea un pedido nuevo, **Then** ve el precio vigente.

---

### Edge Cases

- Un usuario intenta el pedido con menos de 10 minutos de anticipación: el
  sistema MUST rechazarlo con un mensaje claro.
- Un platillo se marca no disponible justo cuando el usuario lo tenía en el
  pedido: el sistema MUST impedir confirmar el pedido con platillos no
  disponibles.
- El pago falla o queda sin confirmar: el pedido MUST NOT quedar como Pagado;
  el usuario MUST recibir un mensaje claro sin información interna.
- El usuario paga pero intenta cancelar antes de la preparación: el pedido
  MAY pasar a Cancelado antes de ser entregado.
- Intentos de salto de estados (Pendiente → Listo) o cambios sobre
  Entregado/Cancelado: el sistema MUST rechazarlos.
- Fallo del servicio de notificación: el estado del pedido MUST seguir siendo
  visible en la consulta de pedidos (el aviso es complemento, no sustituto).
- Falla o lentitud de la conectividad del plantel: la consulta de menú y los
  pedidos en curso MUST informar el problema con mensajes claros, sin corromper
  pedidos ya confirmados.
- Varios pedidos llegan a cocina al mismo tiempo: la pantalla MUST mostrar el
  orden de preparación de forma inequívoca.
- Cajero y pedidos anticipados operan a la vez en horario de receso: ningún
  flujo MUST bloquear al otro.
- Datos incompletos en cualquier formulario: MUST validarse antes de procesarse
  o almacenarse; el usuario MUST recibir un mensaje claro.

## Requirements *(mandatory)*

### Functional Requirements

**Alcance general**

- **FR-001**: El sistema MUST permitir registro e inicio de sesión con correo
  electrónico y contraseña.
- **FR-002**: El sistema MUST asignar a cada usuario un rol: Administrador,
  Cajero, Cocinero o Alumno/Docente, y MUST restringir cada función al rol
  correspondiente.
- **FR-003**: El sistema MUST operar simultáneamente pedidos anticipados y
  pedidos de mostrador sin que un flujo interrumpa al otro.

**Menú**

- **FR-004**: El sistema MUST mostrar a alumnos y docentes el menú del día
  con platillos, precios, disponibilidad y especiales del día.
- **FR-005**: El administrador MUST poder crear y modificar el menú diario,
  gestionar platillos, gestionar especiales del día y asignar o modificar
  precios.
- **FR-006**: El administrador MUST poder marcar platillos como no
  disponibles; los platillos no disponibles MUST NOT poder seleccionarse en
  nuevos pedidos.
- **FR-007**: Los cambios de menú, precios o disponibilidad MUST reflejarse de
  inmediato para los usuarios finales.

**Pedido anticipado**

- **FR-008**: El sistema MUST permitir seleccionar uno o más platillos con sus
  cantidades y MUST mostrar el total antes de confirmar.
- **FR-009**: El sistema MUST aceptar pedidos anticipados sólo cuando falten
  al menos 10 minutos y MUST rechazar los que no cumplan ese mínimo.
- **FR-010**: El sistema MUST impedir crear pedidos que incluyan platillos no
  disponibles o datos inválidos o incompletos.
- **FR-011**: El pago MUST formar parte del flujo de realización del pedido; un
  pedido anticipado pasa a estado Pagado cuando el pago se confirma.

**Pagos**

- **FR-012**: El sistema MUST procesar el pago en línea mediante un servicio
  de pago externo.
- **FR-013**: El sistema MUST NOT almacenar información sensible de tarjetas
  bancarias; sólo MUST registrarse la información necesaria para identificar y
  validar la transacción.
- **FR-014**: Ante un pago no confirmado, el sistema MUST mantener el pedido
  sin estado Pagado y MUST informar el resultado con un mensaje claro.

**Estados del pedido**

- **FR-015**: Todo pedido MUST mantener en todo momento un estado: Pendiente,
  Pagado, En preparación, Listo, Entregado o Cancelado.
- **FR-016**: El flujo de estados válido MUST ser Pendiente → Pagado → En
  preparación → Listo → Entregado, y un pedido MAY pasar a Cancelado antes de
  ser entregado.
- **FR-017**: El sistema MUST rechazar transiciones que salten estados del flujo
  principal y MUST impedir cambiar pedidos en estado Entregado o Cancelado.
- **FR-018**: El alumno o docente MUST poder consultar la lista de sus pedidos
  con el estado actual y el detalle (platillos, cantidades, total).

**Mostrador**

- **FR-019**: El cajero MUST poder capturar pedidos presenciales y registrar y
  gestionar su cobro con la menor cantidad de pasos posible.

**Cocina**

- **FR-020**: El sistema MUST mostrar en una sola pantalla los pedidos entrantes
  (anticipados y de mostrador) con productos, cantidades y orden de preparación,
  actualizándose sin recarga manual.
- **FR-021**: El cocinero MUST poder cambiar el estado de un pedido a En
  preparación y a Listo.

**Notificaciones**

- **FR-022**: Cuando un pedido pasa a Listo, el sistema MUST notificar al
  alumno o docente que su pedido está listo para recoger.
- **FR-023**: La funcionalidad de notificaciones MUST mantenerse separada de la
  lógica principal de pedidos y MAY apoyarse en un servicio externo.

**Calidad y operación**

- **FR-024**: La interfaz MUST ser responsiva y funcionar en móviles y
  computadoras.
- **FR-025**: Las pantallas de caja y cocina MUST priorizar rapidez, legibilidad
  y la menor cantidad de pasos por operación en horarios de receso.
- **FR-026**: El sistema MUST validar los datos antes de procesarlos y
  almacenarlos, sin confiar únicamente en las validaciones del cliente.
- **FR-027**: El sistema MUST mostrar mensajes de error claros y MUST NOT
  exponer información técnica interna del servidor al usuario.
- **FR-028**: Contraseñas y credenciales MUST NOT almacenarse en texto plano ni
  incluirse en el código; la configuración sensible MUST manejarse fuera del
  código fuente.
- **FR-029**: El sistema MUST funcionar con la conectividad disponible en el
  plantel, MUST requerir la menor capacitación posible y MUST poder ejecutarse
  localmente y desplegarse con hosting gratuito o de bajo costo.
- **FR-030**: El servicio actual de mostrador MUST NOT interrumpirse ni
  reemplazarse por este sistema.
- **FR-031**: La interfaz MUST implementarse como una sola aplicación web
  (React con TypeScript, compilada con Vite) con rutas protegidas por JWT y
  rol (`/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos`), y MUST usar
  Tailwind CSS + shadcn/ui como framework de diseño; los diseños de Stitch
  (`.stitch/DESIGN.md`) son una base de referencia modificable y MUST NOT
  considerarse definitivos.

### Key Entities

- **Usuario**: persona con cuenta (correo, contraseña) y un rol asignado; puede
  ser Administrador, Cajero, Cocinero o Alumno/Docente.
- **Rol**: conjunto de funciones accesibles; determina los permisos del usuario
  en el sistema.
- **Platillo**: producto del menú con nombre, precio y disponibilidad.
- **Menú del día**: conjunto de platillos publicados para un día, incluidos los
  especiales del día.
- **Pedido**: solicitud de uno o más platillos con cantidades, total, origen
  (anticipado o mostrador), estado actual y dueño (cuando es anticipado).
- **Detalle de pedido**: relación entre un pedido y cada platillo con su
  cantidad y precio aplicado.
- **Pago**: registro de la transacción asociada a un pedido, con la información
  mínima para identificarla y validarla (sin datos sensibles de tarjeta).
- **Estado de pedido**: valor actual del pedido dentro del flujo
  Pendiente/Pagado/En preparación/Listo/Entregado/Cancelado.
- **Notificación**: aviso enviado al usuario cuando su pedido está Listo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El tiempo de espera en caja se reduce en al menos **50 % durante
  los recesos** respecto a la operación previa al sistema.
- **SC-002**: El **100 % de los pedidos anticipados** puede crearse con al menos
  **10 minutos de anticipación**; ninguno se admite fuera de esa ventana.
- **SC-003**: Los errores derivados de la comunicación verbal de los pedidos se
  reducen a **0 incidentes verificables** en los pedidos capturados en el
  sistema durante la operación medida.
- **SC-004**: Un alumno o docente puede completar el flujo completo (menú →
  selección → pedido → pago → aviso de pedido listo → recogida) sin asistencia
  del personal y en menos de **5 minutos** de su tiempo activo.
- **SC-005**: El **100 % de los pedidos** muestra siempre un estado visible y
  correcto, y ningún pedido cambia a un estado fuera del flujo permitido.
- **SC-006**: El **100 % de los pedidos que llegan a Listo** genera el aviso al
  usuario correspondiente.
- **SC-007**: Durante un receso de alta demanda, cajeros y cocineros pueden
  operar sus tareas sin que los pedidos anticipados bloqueen o ralenticen el
  flujo de mostrador.
- **SC-008**: Cada historia de usuario puede demostrarse de forma independiente
  con datos de prueba reales ante la patrocinadora.

## Assumptions

- Los usuarios se registran con su correo electrónico; se asume uso de correos
  institucionales del plantel para la población de alumnos y docentes.
- Las cuentas iniciales de administrador, cajeros y cocineros se crean de forma
  directa en el arranque del sistema; la gestión masiva posterior es la historia
  P3.
- El menú inicial se carga de forma directa antes de habilitar la gestión de
  menú por el administrador.
- El servicio de pago externo y el servicio de notificación externo estarán
  disponibles en el entorno de despliegue; la identificación de la transacción
  es la única referencia de pago almacenada.
- La ventana de 10 minutos se calcula contra la hora de corte de atención de la
  cafetería configurada para cada día escolar.
- La moneda y presentación de precios corresponden al contexto local del
  plantel.
- El sistema es únicamente web responsiva; no hay aplicación móvil nativa.
- El frontend es una sola aplicación web con rutas por rol; los cuatro roles
  comparten el mismo proyecto y se diferencian por rutas protegidas.
- Los diseños de Stitch (`.stitch/DESIGN.md`) y el framework elegido
  (Tailwind CSS + shadcn/ui) son el punto de partida de la interfaz, sujeto a
  modificaciones durante el desarrollo.
- Están fuera de alcance: reseñas, puntos o lealtad, inventario, proveedores y
  cualquier funcionalidad no listada, según la constitución del proyecto.
