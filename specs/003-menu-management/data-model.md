# Data Model: Gestión de Menú y Consulta de Menú

Tablas existentes (sin migraciones nuevas): `platillo`, `menu_dia`.

## Entidades

### `platillo` (existente)

| Campo | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| nombre | VARCHAR(100) NOT NULL | |
| categoria | VARCHAR(50) | `Comida`, `Bebida`, … (libre) |
| descripcion | TEXT | |
| activo | BOOLEAN | default TRUE; baja lógica del catálogo |
| creado_en / actualizado_en | TIMESTAMP | trigger existente |

**Validación (zod)**: nombre 2–100; categoría ≤ 50; precio en `menu_dia` ≥ 0.

### `menu_dia` (existente)

| Campo | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| fecha | DATE | día de servicio |
| platillo_id | FK → platillo | UNIQUE(fecha, platillo_id) |
| precio | NUMERIC(10,2) ≥ 0 | **congelado** al publicar (research R3) |
| disponible | BOOLEAN | default TRUE |
| especial | BOOLEAN | default FALSE |

**Relaciones**: `menu_dia.platillo_id → platillo.id` (muchos a uno); un
platillo aparece a lo sumo una vez por fecha.

## Consultas principales

```sql
-- Lectura pública del menú (con join a catálogo)
SELECT md.id, p.nombre, p.categoria, p.descripcion, md.precio, md.disponible, md.especial
FROM menu_dia md JOIN platillo p ON p.id = md.platillo_id
WHERE md.fecha = CURRENT_DATE AND p.activo = TRUE
ORDER BY md.especial DESC, p.categoria, p.nombre;

-- Admin: catálogo completo
SELECT id, nombre, categoria, descripcion, activo FROM platillo ORDER BY nombre;

-- Admin: crear platillo
INSERT INTO platillo (nombre, categoria, descripcion) VALUES ($1, $2, $3)
RETURNING id, nombre, categoria, descripcion, activo;

-- Admin: publicar platillo en el menú del día (precio congelado)
INSERT INTO menu_dia (fecha, platillo_id, precio, disponible, especial)
VALUES ($1, $2, $3, TRUE, $4)
ON CONFLICT (fecha, platillo_id) DO UPDATE SET precio = EXCLUDED.precio;

-- Admin: disponibilidad / especial (toggle por fila del menú)
UPDATE menu_dia SET disponible = $2, especial = $3 WHERE id = $1;

-- Admin: editar precio de una fila del menú del día
UPDATE menu_dia SET precio = $2 WHERE id = $1 AND precio >= 0;
```

## Estados y transiciones

No aplica (los estados de pedido son sprints 3–5).

## Impacto en migraciones

**Ninguno.** Todo el esquema existe (`migrations/001_crear_esquema.sql`) y el
seed incluye 8 platillos y el menú de `CURRENT_DATE`
(`migrations/002_seed_inicial.sql`).

## Notas de integridad

- `CHECK (precio >= 0)` a nivel de BD como última línea de defensa.
- `UNIQUE (fecha, platillo_id)` impide duplicar platillos en el menú.
- Los pedidos referencian `pedido_detalle.menu_dia_id`; NO se permite borrar
  filas de `menu_dia` usadas (no hay `ON DELETE CASCADE` → el DELETE del menú
  fallará si hay pedidos; el admin solo deshabilita, no borra).
