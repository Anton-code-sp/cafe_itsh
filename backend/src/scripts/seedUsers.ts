import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { env } from "../config/env.js";

interface SeedAccount {
  nombre: string;
  correo: string;
  password: string | undefined;
  rol: string;
}

export async function seedUsers(): Promise<{ created: number; skipped: number }> {
  const accounts: SeedAccount[] = [
    { nombre: "Administrador", correo: "admin@itsx.mx", password: env.SEED_ADMIN_PASSWORD, rol: "administrador" },
    { nombre: "Cajero", correo: "cajero@itsx.mx", password: env.SEED_CAJERO_PASSWORD, rol: "cajero" },
    { nombre: "Cocinero", correo: "cocinero@itsx.mx", password: env.SEED_COCINERO_PASSWORD, rol: "cocinero" },
  ];

  let created = 0;
  let skipped = 0;

  for (const account of accounts) {
    if (!account.password) {
      console.warn(`[seed] Sin contraseña en env para ${account.correo}; se omite.`);
      skipped += 1;
      continue;
    }

    const { rows: rolRows } = await pool.query<{ id: number }>(
      `SELECT id FROM rol WHERE nombre = $1`,
      [account.rol],
    );
    const rolId = rolRows[0]?.id;
    if (rolId === undefined) {
      throw new Error(`Rol "${account.rol}" no existe. Ejecuta las migraciones primero.`);
    }

    const passwordHash = await bcrypt.hash(account.password, 12);
    const { rowCount } = await pool.query(
      `INSERT INTO usuario (nombre, correo, password_hash, rol_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (correo) DO NOTHING`,
      [account.nombre, account.correo, passwordHash, rolId],
    );

    if (rowCount === 0) {
      console.log(`[seed] Ya existía: ${account.correo}`);
      skipped += 1;
    } else {
      console.log(`[seed] Creado: ${account.correo} (${account.rol})`);
      created += 1;
    }
  }

  return { created, skipped };
}

const isMain = process.argv[1]?.includes("seedUsers");
if (isMain) {
  seedUsers()
    .then(async (result) => {
      console.log(`[seed] Listo — creados: ${result.created}, existentes/omitidos: ${result.skipped}`);
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("[seed] Error:", err instanceof Error ? err.message : err);
      await pool.end();
      process.exit(1);
    });
}
