# Quickstart: 008-ui-redesign

Verificación manual (espejo de los quickstarts 002–006). Requiere
`backend/.env` y Postgres con `cafe_itsh` + migraciones 001–006 aplicadas.

## Backend — entrega de pedidos Listos

```bash
# 0) preparar un pedido Listo (usar tokens de los quickstarts previos)
#    CAFE_SEED_PASSWORD = valor de SEED_*_PASSWORD definido en backend/.env
#    (nunca se documenta en claro en el repositorio)
CAFE_SEED_PASSWORD="${CAFE_SEED_PASSWORD:?Define CAFE_SEED_PASSWORD con el valor de backend/.env}"
TOKEN_CAJA=$(curl -s -X POST localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"correo\":\"cajero@cafe.edu.mx\",\"password\":\"$CAFE_SEED_PASSWORD\"}" | jq -r .token)
TOKEN_COCINA=$(curl -s -X POST localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"correo\":\"cocinero@cafe.edu.mx\",\"password\":\"$CAFE_SEED_PASSWORD\"}" | jq -r .token)
TOKEN_ALUMNO=$(curl -s -X POST localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"correo\":\"alumno@cafe.edu.mx\",\"password\":\"$CAFE_SEED_PASSWORD\"}" | jq -r .token)

# 1) alumno crea pedido y caja lo cobra → Pagado
#    (cotizar + crear + pagar; ver quickstart 004 V2)
# 2) cocina: Pagado → En preparación → Listo
curl -s -X POST localhost:3001/api/kitchen/orders/$PED/start  -H "Authorization: Bearer $TOKEN_COCINA"
curl -s -X POST localhost:3001/api/kitchen/orders/$PED/ready  -H "Authorization: Bearer $TOKEN_COCINA"

# 3) V1 — caja lista pedidos Listo (ambos orígenes)
curl -s localhost:3001/api/counter/orders/ready -H "Authorization: Bearer $TOKEN_CAJA"
# → 200 con arreglo no vacío que incluye número, partidas y cliente

# 4) V2 — entrega
curl -s -X POST localhost:3001/api/counter/orders/$PED/deliver \
  -H "Authorization: Bearer $TOKEN_CAJA"
# → 200 estado "Entregado"

# 5) V3 — segundo deliver → 409; pedido Pagado → 409; alumno → 403; sin token → 401
```

## Frontend (inspección visual)

1. `/caja`: landing con "Capturar pedido" + módulo Entregas con contador.
2. `/caja/capturar`: buscador filtra; chips de categoría; steppers ≥44 px;
   barra flotante "N platillos · total · Ver cobro".
3. `/caja/cobro`: desglose + "Registrar y cobrar" en un paso; éxito con
   folio; fallo permite reintentar/cancelar.
4. `/caja/entregas`: pedido Listo visible; "Entregar" lo retira de la
   lista; vacío muestra "¡Todo está al día!".
5. `/cocina`: tarjeta con folio grande, origen, cliente, "act. hace X s";
   CTA Empezar/Listo.
6. `/menu` (cliente): buscador + chips de categoría; bottom bar con badge;
   en `/mis-pedidos` un pedido Listo muestra "¡Listo para recoger!".
7. `/admin`: landing con 4 tarjetas; drawer incluye Reportes.
