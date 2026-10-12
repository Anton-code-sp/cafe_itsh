# Research: Mostrador (Cajero) y Cocina

Fase 0. Formato: **Decision / Rationale / Alternatives**.

## R1 — Máquina de estados validada por datos

**Decision**: toda transición pasa por `orderService.transition(orderId,
nuevoEstado, actorId)` que valida contra la tabla `transicion_estado`
(SELECT que comprueba que existe la fila `desde → hacia`). Si no existe →
error `409` con mensaje claro. Registra `pedido_estado_historial` con
`cambiado_por`.

**Rationale**: el seed ya define el grafo completo (incluye cancelaciones);
validar con una query = una sola fuente de verdad, sin if/else en código
frágiles (§3 simplicidad; FR-017).

**Alternatives**: máquina de estados codificada en TypeScript — duplica la BD
y puede desincronizarse; descartado.

## R2 — Estado inicial de los pedidos de mostrador

**Decision**: el pedido de mostrador se crea **directamente en `Pagado`** en
una sola operación: INSERT pedido (tipo `mostrador`) + detalles + `pago` con
`metodo='efectivo'` + historial `Pendiente→Pagado` (o directo a Pagado con
historial inicial). `usuario_id = NULL`, `cliente_nombre` opcional.

**Rationale**: el cajero cobra en el momento (spec: "registrar y gestionar su
cobro"); no tiene sentido pasar por `Pendiente`. El flujo del pedido de
mostrador entra a la máquina en `Pagado` y continúa `En preparación →
Listo → Entregado`.

**Alternatives**: crear en Pendiente y cobrar aparte — dos pasos extra en el
receso (contrario a §10).

## R3 — Actualización sin recarga manual del KDS

**Decision**: polling cada 10 s en `/cocina` (`GET /kitchen/orders`) +
refresco tras cada transición local optimista. Sin WebSockets en el MVP.

**Rationale**: cumple FR-020 con cero dependencias; 10 s es aceptable para
preparación de comida y mantiene el servidor simple.

**Alternatives**:
- WebSockets/SSE: tiempo real real, pero agrega conexión persistente y
  manejo de reconexión — evaluar solo si la demo lo exige.
- TanStack Query con `refetchInterval`: ya evaluado en 003 R4; se mantiene
  fetch + intervalo por simplicidad.

## R4 — Orden de preparación

**Decision**: ordenar por `fecha_recoleccion`/`creado_en` ascendente (FIFO por
llegada), con los anticipados priorizados cuando su `fecha_recoleccion` esté
próxima; el KDS muestra folio + tiempo transcurrido + origen (badge
anticipado/mostrador).

**Rationale**: FR-020 y spec US2: "identificar fácilmente el orden de
preparación"; FIFO es la regla que todos entienden sin capacitación.

**Alternatives**: prioridad manual (arrastrar/ordenar) — más UI y riesgo de
error, fuera del alcance.

## R5 — Flujo del cajero: pasos mínimos

**Decision**: una sola pantalla `/caja` con: buscador de platillos del menú
de hoy → clic para agregar → contador de cantidad → total en vivo → botón
"Cobrar y crear pedido" (una acción crea pedido + pago). Último pedido
creado con opción de "deshacer" (cancelar) por si se equivoca.

**Rationale**: §10 (menor cantidad de pasos), objetivo de reducir 50 % el
tiempo de espera.

**Alternatives**: carrito multi-paso como el alumno — más pasos, descartado.

## R6 — Rol Cajero accede a cocina, o viceversa

**Decision**: rutas estrictas: `/caja` solo rol `cajero`, `/cocina` solo
`cocinero` (contrato 002). El admin puede ver ambas (lectura) para auditoría,
si se desea — no requerido por spec.

**Rationale**: FR-002; interfaces separadas para personas distintas con
tareas distintas.
