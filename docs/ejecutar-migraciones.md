# Cómo ejecutar los scripts de migración

Scripts SQL para crear y sembrar la base de datos del **Sistema de Pedidos Anticipados — Cafetería ITSH** en PostgreSQL 18.

## Requisitos

- PostgreSQL 18 instalado y el servicio `postgresql-x64-18` corriendo.
- Rol `cafe_admin` y base de datos `cafe_itsh` creados (ver abajo si aún no existen).

## Conexión

Los datos de acceso:

| Dato | Valor |
|------|-------|
| Servidor | `127.0.0.1:5432` |
| Base de datos | `cafe_itsh` |
| Usuario | `cafe_admin` |
| Contraseña | `<CAFE_DB_PASSWORD>` (la defines tú; no la commitees) |

Si configuraste el archivo `pgpass.conf` (en `C:\Users\<usuario>\AppData\Roaming\postgresql\`), `psql` conectará sin pedir la contraseña.

## Ejecutar los scripts (en orden)

Desde la carpeta del proyecto, en PowerShell o CMD:

```bash
psql -U cafe_admin -h 127.0.0.1 -d cafe_itsh -f migrations/001_crear_esquema.sql
psql -U cafe_admin -h 127.0.0.1 -d cafe_itsh -f migrations/002_seed_inicial.sql
```

**Importante:** ejecutar `001` antes que `002`. El `001` crea las tablas; el `002` inserta los datos base (roles, estados, transiciones, platillos y menú de ejemplo).

Si `psql` no está en el PATH, usa la ruta completa:

```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U cafe_admin -h 127.0.0.1 -d cafe_itsh -f migrations/001_crear_esquema.sql
```

## Ejecutar con DBeaver

1. Abre DBeaver y crea una conexión a PostgreSQL con los datos de la tabla de arriba.
2. Abre el archivo `migrations/001_crear_esquema.sql` en un editor SQL.
3. Selecciona toda la consulta y ejecuta (Ctrl+Enter o botón SQL → Execute SQL script).
4. Repite con `migrations/002_seed_inicial.sql`.

## Verificar que todo quedó bien

```bash
psql -U cafe_admin -h 127.0.0.1 -d cafe_itsh -c "\dt"
```

Debe mostrar 11 tablas: `estado_pedido`, `menu_dia`, `notificacion`, `pago`, `pedido`, `pedido_detalle`, `pedido_estado_historial`, `platillo`, `rol`, `transicion_estado`, `usuario`.

Ver el menú de ejemplo del día:

```bash
psql -U cafe_admin -h 127.0.0.1 -d cafe_itsh -c "SELECT md.fecha, p.nombre, md.precio, md.especial FROM menu_dia md JOIN platillo p ON p.id = md.platillo_id ORDER BY p.nombre;"
```

## Notas

- Los scripts usan `IF NOT EXISTS` / `ON CONFLICT DO NOTHING` en los catálogos, por lo que son seguros de re-ejecutar en su mayoría. Sin embargo, `001` usa `CREATE TABLE` normal: si las tablas ya existen, fallará con "relation already exists" (esto es esperado; no re-ejecutes `001` sobre una BD ya poblada sin antes limpiar).
- El menú de ejemplo se inserta con la fecha actual (`CURRENT_DATE`). Para tener menú en otro día, ejecuta un `INSERT` manual en `menu_dia` con la fecha deseada.
- La contraseña del superusuario de instancia (`postgres`) no debe documentarse en el repo; se recomienda usar siempre **`cafe_admin`** para el trabajo diario del proyecto.
