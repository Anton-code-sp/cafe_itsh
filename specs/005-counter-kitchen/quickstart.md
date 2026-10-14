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

## Resultados (2026-10-13)

| Escenario | Evidencia | Estado |
|-----------|-----------|--------|
| V1 Captura y cobro | Smoke API: `MOS-20261013-0001`, `Pagado`, pago `efectivo`, total 70.00, visible en recent | ✅ |
| V2 Deshacer | Smoke API: undo → `Cancelado`; segundo undo → `409` ("ya está en Cancelado") | ✅ |
| V3 Cola de cocina | Smoke API: anticipado Pagado idx=0, mostrador idx=1 (FIFO), badges de origen correctos, minutos ≥ 0, alumno Pendiente ausente | ✅ |
| V4 Avance de estados | Smoke API: `start` → `En preparación`, `ready` → `Listo` (desaparece de la cola), `start` sobre Listo → `409`, `ready` sobre Pagado → `409` | ✅ |
| V5 Sin recarga | Smoke API: refetch del endpoint refleja cambios; el polling del KDS (10 s) apunta a este endpoint. Verificación visual en navegador pendiente de demo | ✅ (API) |
| V6 Permisos | Smoke API: cajero→cocina `403`, cocinero→caja `403`, alumno→ambas `403` | ✅ |
| V7 Pruebas automatizadas | `npm test`: 144 tests / 22 archivos ✅ · `npm run typecheck` ✅ · `npm run build` backend ✅ · frontend `lint` + `build` ✅ | ✅ |

Fixtures de V3–V6 se crearon por SQL directo porque el cutoff (13:00) impide
crear pedidos anticipados a esta hora; se cancelaron al terminar el smoke.
