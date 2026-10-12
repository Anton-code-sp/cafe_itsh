import { pool } from "../db/pool.js";
import { badRequest, conflict, notFound } from "../errors.js";

export interface MenuItem {
  id: number;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  precio: string;
  disponible: boolean;
  especial: boolean;
}

export interface MenuByDate {
  fecha: string;
  items: MenuItem[];
}

export async function getMenuByDate(fecha?: string): Promise<MenuByDate> {
  const value = fecha ?? null;

  const { rows: fechaRows } = await pool.query<{ fecha: string }>(
    `SELECT TO_CHAR(COALESCE($1::date, CURRENT_DATE), 'YYYY-MM-DD') AS fecha`,
    [value],
  );

  const { rows } = await pool.query<MenuItem>(
    `SELECT md.id, p.nombre, p.categoria, p.descripcion,
            md.precio, md.disponible, md.especial
       FROM menu_dia md
       JOIN platillo p ON p.id = md.platillo_id
      WHERE md.fecha = COALESCE($1::date, CURRENT_DATE)
        AND p.activo = TRUE
      ORDER BY md.especial DESC, p.categoria, p.nombre`,
    [value],
  );

  return { fecha: fechaRows[0].fecha, items: rows };
}

export interface MenuDayRow {
  id: number;
  nombre: string;
  precio: string;
  disponible: boolean;
  especial: boolean;
  disponible_en_catalogo: boolean;
}

export async function getMenuDayAdmin(
  fecha?: string,
): Promise<{ fecha: string; items: MenuDayRow[] }> {
  const value = fecha ?? null;

  const { rows: fechaRows } = await pool.query<{ fecha: string }>(
    `SELECT TO_CHAR(COALESCE($1::date, CURRENT_DATE), 'YYYY-MM-DD') AS fecha`,
    [value],
  );

  const { rows } = await pool.query<MenuDayRow>(
    `SELECT md.id, p.nombre, md.precio, md.disponible, md.especial,
            p.activo AS disponible_en_catalogo
       FROM menu_dia md
       JOIN platillo p ON p.id = md.platillo_id
      WHERE md.fecha = COALESCE($1::date, CURRENT_DATE)
      ORDER BY md.especial DESC, p.categoria, p.nombre`,
    [value],
  );

  return { fecha: fechaRows[0].fecha, items: rows };
}

async function getMenuDayRow(id: number): Promise<MenuDayRow> {
  const { rows } = await pool.query<MenuDayRow>(
    `SELECT md.id, p.nombre, md.precio, md.disponible, md.especial,
            p.activo AS disponible_en_catalogo
       FROM menu_dia md
       JOIN platillo p ON p.id = md.platillo_id
      WHERE md.id = $1`,
    [id],
  );
  if (!rows[0]) throw notFound("Fila del menú no encontrada");
  return rows[0];
}

export async function publishMenuDay(
  fecha: string,
  platilloId: number,
  precio: number,
  especial: boolean,
): Promise<MenuDayRow> {
  if (precio < 0) throw badRequest("El precio no puede ser negativo");

  const { rows, rowCount } = await pool.query<{ id: number }>(
    `INSERT INTO menu_dia (fecha, platillo_id, precio, disponible, especial)
     VALUES ($1, $2, $3, TRUE, $4)
     ON CONFLICT (fecha, platillo_id) DO NOTHING
     RETURNING id`,
    [fecha, platilloId, precio, especial],
  );

  if (rowCount === 0 || !rows[0]) {
    throw conflict("Ese platillo ya está publicado en esa fecha");
  }

  return getMenuDayRow(rows[0].id);
}

export async function updateMenuDayRow(
  id: number,
  changes: { precio?: number; disponible?: boolean; especial?: boolean },
): Promise<MenuDayRow> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (changes.precio !== undefined) {
    if (changes.precio < 0) throw badRequest("El precio no puede ser negativo");
    sets.push(`precio = $${i++}`);
    values.push(changes.precio);
  }
  if (changes.disponible !== undefined) {
    sets.push(`disponible = $${i++}`);
    values.push(changes.disponible);
  }
  if (changes.especial !== undefined) {
    sets.push(`especial = $${i++}`);
    values.push(changes.especial);
  }

  if (sets.length === 0) throw badRequest("Debe indicar al menos un campo a actualizar");

  values.push(id);

  const { rowCount } = await pool.query(
    `UPDATE menu_dia SET ${sets.join(", ")} WHERE id = $${i}`,
    values,
  );

  if (rowCount === 0) throw notFound("Fila del menú no encontrada");
  return getMenuDayRow(id);
}
