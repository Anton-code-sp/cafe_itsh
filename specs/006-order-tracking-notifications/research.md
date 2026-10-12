# Research: Seguimiento y Notificaciones

Fase 0. Formato: **Decision / Rationale / Alternatives**.

## R1 — Notificación disparada en la transición de estado

**Decision**: `orderService.transitionOrder` (creado en 005 T002) inserta
además una fila `notificacion` en la **misma transacción** que cambia el
estado (canal preferido del usuario: `correo` por defecto). Un job simple
(`notificationService.flush` invocado por intervalo en dev, o tras cada
transición) marca `enviada`/`fallida` y escribe el contenido sandbox.

**Rationale**: un solo punto de disparo evita avisos olvidados; transacción
garantiza que solo se notifica si el cambio ocurrió realmente. Compatible
con tabla existente y con FR-030 (estado `fallida` manejado).

**Alternatives**: disparar desde cada controller — duplica lógica y se
desincroniza fácilmente; descartado.

## R2 — Canal sandbox de envío

**Decision**: `NOTIFY_CHANNEL=console|smtp` (env). En `console` (dev/demo):
el "envío" escribe el asunto/cuerpo en el log de Node y marca `enviada`.
En `smtp`: usa `nodemailer` u `smtp` nativo **solo si** se configuran envs
SMTP_* — añadir `nodemailer` como dependencia SOLO con aprobación explícita
(§16); el MVP vive con `console`.

**Rationale**: demo completa sin proveedor ni credenciales reales;
persistencia en `notificacion` da trazabilidad para la auditoría del MVP.

**Alternatives**: integrar SendGrid/Mailgun desde el inicio — dependencias y
cuentas innecesarias para el alcance actual.

## R3 — Actualización de `/mis-pedidos` sin push

**Decision**: polling cada 15 s + refresco al volver a la pestaña (focus).
El badge de estado usa componente único `OrderStatusBadge` compartido con
admin/cocina.

**Rationale**: FR-025–026; coherente con el enfoque sin WebSockets de 005
R3; 15 s basta para el usuario que espera su comida.

**Alternatives**: WebSockets — mismo costo/beneficio que 005 R3; fuera del
alcance.

## R4 — Contenido del mensaje de notificación

**Decision**: asunto `Tu pedido {numero} está {estado}` + cuerpo con folio,
estado y total; **nunca** platillos, teléfono ni datos de pago (reglas §8 y
spec: no exponer información sensible). Plantilla simple en
`notificationService.render(status)`.

**Rationale**: FR-029; mínimo indispensable para el alumno.

**Alternatives**: mensaje con detalle completo — mayor riesgo y ruido.

## R5 — Reporte para admin

**Decision**: endpoint `GET /reports/ventas?desde&hasta` con agregados:
total de pedidos, monto total, desglose por estado y por tipo
(anticipado/mostrador). Pantalla `/admin/reportes` con tabla shadcn; sin
gráficas en el MVP (framer-motion/no-charting por ahora).

**Rationale**: US2 admin cierre; una vista de una tabla basta para decidir
"qué platillos preparar".

**Alternatives**: dashboard con charts — dependencia extra; evaluar después
del MVP.

## R6 — Política de cancelación refinada (pulido)

**Decision**: centralizar textos/CTAs de estados en `OrderStatusBadge` y
bloquear cancelación desde UI en `Listo`/`Entregado` (servidor ya rechaza
con 409). Ajustar el mensaje de error a lenguaje de receso ("Tu pedido ya
está en preparación y no puede cancelarse").

**Rationale**: US2 pulido + reglas §15.
