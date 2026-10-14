# Verificación final — quickstarts 002–006

**Fecha**: 2026-10-14
**Rama**: `spec/006-order-tracking-notifications`
**Contexto**: cierre de T027 (Sprint 5). Corrida de punta a punta de los
quickstarts de las specs 002–006 contra el backend real (`localhost:3001`,
Postgres local) más la suite automatizada.

## Comandos de verificación

| Verificación | Comando / script | Resultado |
|---|---|---|
| V7 backend (tests + typecheck) | `cd backend && npm test && npm run typecheck` | ✅ 178 tests en verde, `tsc --noEmit` sin errores |
| Build backend | `cd backend && npm run build` | ✅ |
| Frontend | `cd frontend && npm run lint && npm run build` | ✅ sin errores |
| Quickstarts 002–005 (API) | `smoke-quickstarts.ps1` (Fase A cutoff 00:00 + Fase B 23:59/UTC) | ✅ 42/42 checks |
| Quickstart 006 V1–V4 | `smoke-v1v4.ps1` | ✅ |
| Quickstart 006 V5–V6 | `smoke-v5v6.ps1` | ✅ |

## Resultados por quickstart

### 002 — Fundación y autenticación

- **V1 login**: 4 roles (`admin@itsx.mx`, `cajero@itsx.mx`,
  `cocinero@itsx.mx`, alumno recién registrado) → `200`; password incorrecta →
  `401 "Credenciales inválidas"`. ✅
- **V2 permisos básicos**: cocinero en `/api/users` → `403`; sin token →
  `401`. ✅
- **V3 registro de cliente**: dominio `itsx.mx` → `200` + login automático;
  correo repetido → `409`; dominio no permitido (`@gmail.com`) → `400`. ✅
  - **Hallazgo corregido en este cierre**: `isAllowedEmailDomain` estaba
    declarado en `env.ts` pero no se validaba en el registro (002 V3 lo
    exige). Fix en `backend/src/services/userService.ts` (commit
    `36c8903`) + test unitario (178 → 178 con el nuevo caso incluido).
- **V4 seed**: `npm run seed` dos corridas seguidas → `exit 0` sin duplicados
  (`ON CONFLICT DO NOTHING`). ✅
- **V5 usuarios operativos**: admin crea cajero (`password_hash` nunca
  expuesto) → login OK; `PATCH {activo:false}` → login posterior rechazado
  con `403 "Cuenta desactivada"`. ✅

### 003 — Gestión de menú

- **V1 consulta**: `GET /api/menu` con sesión de alumno → `200` con
  `fecha` + `items`. ✅
- **V2 catálogo**: crear platillo → `201`; sin nombre → `400`;
  deshabilitar otro platillo → la fila **sigue existiendo** marcada inactiva
  (se conserva el historial) y la Torta creada permanece activa para
  publicarse. ✅
- **V3 publicación**: publicar Torta en el menú de hoy → `201`; publicar el
  mismo platillo dos veces el mismo día → `409`. ✅
- **V4 reflejo inmediato**: `PATCH` de `disponible:false` y de `precio:45`
  sobre la fila del día → el siguiente `GET /api/menu` del alumno refleja
  ambos cambios. ✅
- **V5 permisos**: cocinero en `/api/dishes` → `403`; sin sesión → `401`. ✅

### 004 — Pedido anticipado y pago

- **V1 preview/quote**: `GET /api/orders/quote` → `200` con `total`
  calculado por el servidor y `canOrder:true`. ✅
- **V2 flujo con pago**: crear → folio `PED-…` + estado `Pendiente`;
  `POST /payments/:id/confirm` → `Pagado`; segunda confirmación → `409`;
  `GET /orders/:id` refleja estado y pago. ✅
- **V3 ventana de 10 minutos**:
  - Con corte rebasado (`CUTOFF_TIME=00:00`, hora local 00:10): quote →
    `canOrder:false`; creación → `409` "al menos 10 minutos". ✅
  - Con corte abierto (`CUTOFF_TIME=23:59`): creación permitida. ✅
- **V4 sin pago**: pedido sin confirmar queda `Pendiente` con `pago:null`. ✅
- **V5 platillo no disponible**: marcar `disponible:false` → quote y
  creación rechazados. ✅
- **V6 cancelaciones**: cancelar `Pendiente` y cancelar `Pagado` →
  `Cancelado`. ✅
- **Permisos/validación**: pedido inexistente → `404`; pedido ajeno → `403`;
  `items:[]` → `400`; sin sesión → `401`. ✅

### 005 — Mostrador y cocina

- **V1 cobro de mostrador**: `POST /api/counter/orders` → folio
  `MOS-…`, estado `Pagado`, pago `efectivo` y visible en
  `/counter/orders/recent`. ✅
- **V2 deshacer**: `undo` → `Cancelado`; segundo `undo` → `409`. ✅
- **V3 cola FIFO**: con anticipado `Pagado` y mostrador `Pagado`, la cola
  (`GET /kitchen/orders`) viene ordenada por `creado_en ASC`, con badge de
  origen (`tipo`); el pedido del alumno **sin pagar** y los cancelados no
  aparecen. ✅
- **V4 avance de estados**: `start` → `En preparación`; `ready` → `Listo`
  (la tarjeta sale de la cola); `start` sobre `Listo` → `409`; `ready`
  sobre `Pagado` → `409`. ✅
- **V6 permisos cruzados**: cocinero en caja `403`, cajero en cocina `403`,
  alumno en ambos `403`. ✅
- **V5 (UI en vivo, 10 s)**: pendiente de demo en navegador.

### 006 — Seguimiento, notificaciones y pulido (Sprint 5)

- **V1 lista de pedidos**: `/api/my-orders` ordenada con detalle, total y
  fecha de recolección. ✅
- **V2 refetch**: cambios de estado (cocina → `Listo`) se reflejan en
  `/my-orders` sin recarga manual. ✅
- **V3 notificación sandbox**: transición a `Listo` genera el aviso con
  asunto correcto, fila `enviada` en `/notifications` y log sandbox. ✅
- **V4 aislamiento**: alumno A sobre pedido de alumno B → `403` (detalle y
  avisos); listas separadas. ✅
- **V5 reporte admin**: permisos `401`/`403`, rango inválido → `400`,
  consistencia `resumen` vs SQL del día y `porEstado`/`porTipo` sumando el
  mismo total. ✅
- **V6 cancelación en UI/API**: `409` en `En preparación` y `Listo` (la UI
  oculta el botón y muestra el mensaje); flujo alumno → cocina → `Listo`
  visible en `/my-orders`. ✅
- **V7 pruebas**: 178 tests + typecheck. ✅

## Notas y pendientes

1. **Dominio institucional (002 V3)**: el registro ahora valida
   `ALLOWED_EMAIL_DOMAINS` (`itsx.mx`, `its.edu.mx`); commit `36c8903`.
2. **Desvíos de datos de corridas previas**: el cajero de prueba del smoke
   queda desactivado a propósito (002 V5) y un platillo de prueba queda
   inactivo (003 V2); el menú del día puede conservar filas publicadas por
   los smokes (comportamiento esperado: no hay limpieza automática).
3. **Pendiente de demo en navegador** (usuario): demo visual de los
   quickstarts con interfaz, T017 de `specs/007-ui-foundation/tasks.md` y
   demo final de Sprint 5 ante la patrocinadora.
4. Los scripts de verificación viven fuera del repo
   (`%TEMP%\opencode\smoke-*.ps1`); no son parte del entregable.
