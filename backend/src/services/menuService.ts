import { pool } from "../db/pool.js";

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
