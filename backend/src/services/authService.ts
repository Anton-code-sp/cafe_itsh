import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { env } from "../config/env.js";
import { forbidden, unauthorized } from "../errors.js";

export interface LoginResult {
  token: string;
  user: { id: number; nombre: string; correo: string; rol: string };
}

interface UserRow {
  id: number;
  nombre: string;
  correo: string;
  activo: boolean;
  password_hash: string;
  rol: string;
}

export async function login(correo: string, password: string): Promise<LoginResult> {
  const { rows } = await pool.query<UserRow>(
    `SELECT u.id, u.nombre, u.correo, u.activo, u.password_hash, r.nombre AS rol
     FROM usuario u
     JOIN rol r ON r.id = u.rol_id
     WHERE u.correo = $1`,
    [correo],
  );

  const user = rows[0];
  const genericError = unauthorized("Credenciales inválidas");

  if (!user) throw genericError;

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) throw genericError;

  if (!user.activo) throw forbidden("Cuenta desactivada. Contacta al administrador.");

  const token = jwt.sign(
    { sub: user.id, rol: user.rol, nombre: user.nombre },
    env.JWT_SECRET,
    { expiresIn: "8h" },
  );

  return {
    token,
    user: { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol },
  };
}
