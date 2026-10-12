import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { conflict, notFound } from "../errors.js";

export interface PublicUser {
  id: number;
  nombre: string;
  correo: string;
  activo: boolean;
  rol: string;
}

const OPERATIVE_ROLES = ["administrador", "cajero", "cocinero"] as const;

async function getRoleId(nombre: string): Promise<number> {
  const { rows } = await pool.query<{ id: number }>(
    `SELECT id FROM rol WHERE nombre = $1`,
    [nombre],
  );
  const id = rows[0]?.id;
  if (id === undefined) throw new Error(`Rol "${nombre}" no existe en la BD`);
  return id;
}

export async function registerClient(
  nombre: string,
  correo: string,
  password: string,
): Promise<PublicUser> {
  const rolId = await getRoleId("usuario");
  const passwordHash = await bcrypt.hash(password, 12);

  const { rows, rowCount } = await pool.query<PublicUser>(
    `INSERT INTO usuario (nombre, correo, password_hash, rol_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (correo) DO NOTHING
     RETURNING id, nombre, correo, activo, 'usuario' AS rol`,
    [nombre, correo, passwordHash, rolId],
  );

  if (rowCount === 0 || !rows[0]) throw conflict("El correo ya está registrado");
  return rows[0];
}

export async function listOperatives(): Promise<PublicUser[]> {
  const { rows } = await pool.query<PublicUser>(
    `SELECT u.id, u.nombre, u.correo, u.activo, r.nombre AS rol
     FROM usuario u
     JOIN rol r ON r.id = u.rol_id
     WHERE r.nombre = ANY($1)
     ORDER BY u.id`,
    [OPERATIVE_ROLES],
  );
  return rows;
}

export async function createOperative(
  nombre: string,
  correo: string,
  password: string,
  rol: string,
): Promise<PublicUser> {
  const rolId = await getRoleId(rol);
  const passwordHash = await bcrypt.hash(password, 12);

  const { rows, rowCount } = await pool.query<PublicUser>(
    `INSERT INTO usuario (nombre, correo, password_hash, rol_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (correo) DO NOTHING
     RETURNING id, nombre, correo, activo, $5::text AS rol`,
    [nombre, correo, passwordHash, rolId, rol],
  );

  if (rowCount === 0 || !rows[0]) throw conflict("El correo ya está registrado");
  return rows[0];
}

export async function updateOperative(
  id: number,
  changes: { nombre?: string; correo?: string; activo?: boolean; rol?: string },
): Promise<PublicUser> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (changes.nombre !== undefined) {
    sets.push(`nombre = $${i++}`);
    values.push(changes.nombre);
  }
  if (changes.correo !== undefined) {
    sets.push(`correo = $${i++}`);
    values.push(changes.correo);
  }
  if (changes.activo !== undefined) {
    sets.push(`activo = $${i++}`);
    values.push(changes.activo);
  }
  if (changes.rol !== undefined) {
    sets.push(`rol_id = $${i++}`);
    values.push(await getRoleId(changes.rol));
  }

  if (sets.length === 0) throw notFound("No hay campos para actualizar");

  values.push(id);

  const { rows, rowCount } = await pool.query<PublicUser>(
    `UPDATE usuario u
     SET ${sets.join(", ")}
     FROM rol r
     WHERE r.id = u.rol_id AND u.id = $${i}
     RETURNING u.id, u.nombre, u.correo, u.activo, r.nombre AS rol`,
    values,
  );

  if (rowCount === 0 || !rows[0]) throw notFound("Usuario no encontrado");
  return rows[0];
}
