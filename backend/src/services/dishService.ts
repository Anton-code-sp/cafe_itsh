import { pool } from "../db/pool.js";
import { badRequest, notFound } from "../errors.js";

export interface Dish {
  id: number;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  activo: boolean;
}

export async function listDishes(): Promise<Dish[]> {
  const { rows } = await pool.query<Dish>(
    `SELECT id, nombre, categoria, descripcion, activo
       FROM platillo
      ORDER BY nombre`,
  );
  return rows;
}

export async function createDish(input: {
  nombre: string;
  categoria?: string;
  descripcion?: string;
}): Promise<Dish> {
  const nombre = input.nombre.trim();
  if (nombre.length < 2) throw badRequest("El nombre debe tener al menos 2 caracteres");

  const { rows } = await pool.query<Dish>(
    `INSERT INTO platillo (nombre, categoria, descripcion)
     VALUES ($1, $2, $3)
     RETURNING id, nombre, categoria, descripcion, activo`,
    [nombre, input.categoria ?? null, input.descripcion ?? null],
  );
  return rows[0];
}

export async function updateDish(
  id: number,
  changes: { nombre?: string; categoria?: string; descripcion?: string; activo?: boolean },
): Promise<Dish> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (changes.nombre !== undefined) {
    const nombre = changes.nombre.trim();
    if (nombre.length < 2) throw badRequest("El nombre debe tener al menos 2 caracteres");
    sets.push(`nombre = $${i++}`);
    values.push(nombre);
  }
  if (changes.categoria !== undefined) {
    sets.push(`categoria = $${i++}`);
    values.push(changes.categoria);
  }
  if (changes.descripcion !== undefined) {
    sets.push(`descripcion = $${i++}`);
    values.push(changes.descripcion);
  }
  if (changes.activo !== undefined) {
    sets.push(`activo = $${i++}`);
    values.push(changes.activo);
  }

  if (sets.length === 0) throw badRequest("Debe indicar al menos un campo a actualizar");

  values.push(id);

  const { rows, rowCount } = await pool.query<Dish>(
    `UPDATE platillo
        SET ${sets.join(", ")}
      WHERE id = $${i}
      RETURNING id, nombre, categoria, descripcion, activo`,
    values,
  );

  if (rowCount === 0 || !rows[0]) throw notFound("Platillo no encontrado");
  return rows[0];
}
