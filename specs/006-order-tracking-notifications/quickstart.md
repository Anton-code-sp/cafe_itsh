# Quickstart: Seguimiento y Notificaciones

Supone Sprints 1–4 completos.

## Comandos

```bash
cd backend && npm run dev     # :3001 (NOTIFY_CHANNEL=console)
cd frontend && npm run dev    # :5173
```

## Escenarios de validación

### V1 — Lista de mis pedidos (US1)

1. Login alumno que ya pagó un pedido → `/mis-pedidos`.
2. **Esperado**: tarjeta con folio, badge de estado, total; orden reciente
   primero; sin recargar manual.

### V2 — Cambio de estado en vivo (US1)

1. Cocinero pasa el pedido a `En preparación` y luego `Listo` en `/cocina`.
2. **Esperado**: `/mis-pedidos` (misma sesión alumno) refleja cada cambio en
   ≤ 15 s (polling) o al volver a la pestaña.

### V3 — Notificación sandbox (US1)

1. Con `NOTIFY_CHANNEL=console`, al pasar a `Listo` revisar la terminal del
   backend: log con asunto `Tu pedido {numero} está Listo` y cuerpo sin
   datos sensibles.
2. `GET /my-orders/:id/notifications` → **esperado**: al menos una fila
   `enviada` con ese asunto.

### V4 — Aislamiento de datos (US1)

1. Alumno A intenta `GET /my-orders/:id` del pedido de alumno B → **403**.

### V5 — Reporte admin (US2)

1. Login admin → `/admin/reportes` con rango del día → **esperado**: totales
   por estado y por tipo consistentes con los pedidos creados.
2. Cajero/cocinero → **403**.

### V6 — Pulido y demo end-to-end (US2)

1. Flujo completo: alumno pide y paga → caja/cocina avanzan → alumno ve
   estados y badge coherente en todas sus pantallas → recoge.
2. **Esperado**: sin errores de consola, textos comprensibles, cancelación
   bloqueada en UI cuando el pedido ya está en preparación.

### V7 — Pruebas automatizadas

```bash
cd backend && npm test && npm run typecheck
```
Cubrir: `/my-orders` dueño-only, encolado de notificación en la transición,
reporte agregado, permisos.

## Resultado esperado

MVP cerrado: alumno → caja/cocina → alumno con avisos; admin con reporte
básico; demo de 5 minutos sin pasos ocultos.
