# Quickstart: Mostrador (Cajero) y Cocina

Supone Sprints 1–3 completos y dos usuarios de prueba: cajero y cocinero.

## Comandos

```bash
cd backend && npm run dev     # :3001
cd frontend && npm run dev    # :5173
```

## Escenarios de validación

### V1 — Captura y cobro de mostrador (US1)

1. Login cajero → `/caja` → agregar 2× item del menú de hoy → total en vivo.
2. Cobrar → **esperado**: pedido `MOS-AAAAAAAAN-0001`, estado `Pagado`,
   pago `efectivo` registrado, último pedido visible en la pantalla.

### V2 — Deshacer error de captura (US1)

1. Tras crear un pedido de mostrador, pulsar "Deshacer" → **esperado**:
   `Cancelado`. Si ya avanzó a preparación → **esperado**: `409`.

### V3 — Cola de cocina (US2)

1. Con un pedido anticipado `Pagado` y uno de mostrador, login cocinero →
   `/cocina` → **esperado**: ambas tarjetas, orden FIFO, badge de origen,
   minutos de espera; el alumno NO aparece (no preparación).

### V4 — Avance de estados (US2)

1. "Empezar" → **esperado**: `En preparación`.
2. "Listo" → **esperado**: `Listo`; la tarjeta desaparece de la cola.
3. Invocar `POST /start` sobre un pedido ya `Listo` → **esperado**: `409`
   con mensaje claro (sin saltos).

### V5 — Actualización sin recarga (US2)

1. Con `/cocina` abierto, crear un pedido desde `/caja` en otra sesión →
   **esperado**: aparece solo ≤ 10 s sin recargar.

### V6 — Permisos

1. Cocinero en `/caja` → **esperado**: `403`. Cajero en `/cocina` → `403`.
2. Alumno en ambas → `403`.

### V7 — Pruebas automatizadas

```bash
cd backend && npm test && npm run typecheck
```
Cubrir: creación de mostrador (Pagado directo), máquina de estados
(transición inválida → rechazo, historial insertado), cola FIFO, permisos por
rol.

## Resultado esperado

El cajero atiende el mostrador sin afectar el flujo del alumno; la cocina ve
una sola cola clara y avanza pedidos con un clic, con rastro completo en el
historial.
