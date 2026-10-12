# Research: Pedido Anticipado y Pago

Fase 0. Formato: **Decision / Rationale / Alternatives**.

## R1 — Validación de la ventana de 10 minutos

**Decision**: variable de entorno `CUTOFF_TIME` (hora de corte, ej.
`13:00`) + regla: el pedido debe crearse con ≥ 10 minutos antes de esa hora
para el día seleccionado. Validación **siempre en el servidor**; el frontend
muestra el motivo devuelto. Cálculo en zona horaria del servidor
(`America/Mexico_City` vía env `TZ`).

**Rationale**: reglas §7 y spec FR-009; el servidor es la única autoridad
(FR-026: no confiar en el cliente). Hora de corte configurable = la
cafetería decide su horario.

**Alternatives**:
- Validar contra `fecha_recoleccion` elegida por el usuario: más flexible,
  pero agrega UX de selector de hora (fuera del alcance del MVP).
- Hardcodear la hora: viola §16 (configuración por entorno).

## R2 — Cálculo de totales

**Decision**: el total SIEMPRE se calcula en el servidor al crear el pedido:
`SUM(cantidad × menu_dia.precio)` con los precios vigentes del menú del día;
`pedido.total` y `pedido_detalle.subtotal/precio_unitario` se persisten
congelados. El frontend solo muestra el total devuelto.

**Rationale**: defensa contra manipulación del cliente (spec: "ver el total
antes de confirmar" — lo muestra el servidor en el preview); congelar precios
garantiza que un cambio posterior del menú no altere el pedido.

**Alternatives**: confiar en el total del cliente — inseguro, descartado.

## R3 — Pasarela de pago (sandbox)

**Decision**: capa `paymentService` con interfaz `createPayment(intent)` +
`confirmPayment(ref)`. En desarrollo usa un **adaptador sandbox** que aprueba
siempre (o con tarjetas de prueba) y devuelve `referencia` ficticia; en
producción se conecta al proveedor real (Stripe/mercadoPago — por definir con
`PAYMENT_API_KEY`). El flujo del pedido: `Pendiente` → al confirmar pago →
`Pagado` + registro en `pago` con `referencia`.

**Rationale**: spec FR-012/013: pago externo, sin datos de tarjeta en el
sistema. La interfaz aísla al resto del código del proveedor (§3: mantener
estructura sencilla). El sandbox permite demo completa sin credenciales reales.

**Alternatives**:
- Stripe SDK directamente: dependencia pesada + requiere cuenta/cróbitos —
  se adoptará al definir el proveedor real.
- Pago simulado sin capa de adaptador: más simple, pero luego hay que
  reescribir el flujo — la interfaz de 2 métodos cuesta poco.

## R4 — Estados iniciales del pedido

**Decision**: al crear el pedido → estado `Pendiente` (fila en `pedido` +
`pedido_estado_historial`). Cuando el pago confirma → `Pagado`. Si el pago
falla/rechaza → el pedido queda `Pendiente`. Cancelación permitida desde
`Pendiente` y `Pagado` (antes de que exista preparación); la política
completa con `Listo` queda para el sprint 4.

**Rationale**: spec FR-015/016 + seed de `transicion_estado` (Pendiente→Pagado,
Pendiente→Cancelado y Pagado→Cancelado ya insertados; la spec maestra permite
`MAY` pasar a Cancelado antes de ser entregado).

**Alternatives**: crear directamente en `Pagado` — imposible: el pago es
posterior a la creación.

## R5 — Folio (`pedido.numero`)

**Decision**: generar en el servidor con formato `PED-YYYYMMDD-XXXX` donde
`XXXX` es un contador diario (subconsulta `COUNT(*)` del día + 1 con
reintento ante colisión) o hash corto. Unicidad garantizada por el constraint
`UNIQUE`.

**Rationale**: legible para caja/cocina/cliente (spec: "ver el total antes
de confirmar" + "identificar el folio").

**Alternatives**: id numérico simple — menos legible en mostrador.

## R6 — Confirmación de pedido vs flujo de pago

**Decision**: endpoint único de creación que hace transacción: INSERT pedido +
detalles → llama a `paymentService.createPayment` → responde
`{ orderId, numero, total, payment: { reference, status } }`. El frontend
redirige a `PaymentPage`; la confirmación (simulada en sandbox) llama
`POST /payments/:reference/confirm` → `Pagado`.

**Rationale**: dos pasos claros (crear pendiente, confirmar pago) alineados
con el flujo de estados y con un webhook futuro real sin reescribir.

**Alternatives**: crear y pagar en un solo request — no deja rastro del caso
"pago no confirmado" que la spec exige probar (FR-014).
