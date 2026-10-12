import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ApiError } from "../errors.js";
import { env } from "../config/env.js";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn() },
}));

import { pool } from "../db/pool.js";
import { login } from "./authService.js";

const queryMock = vi.mocked(pool.query);

function userRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 3,
    nombre: "Ana López",
    correo: "alumno@itsx.mx",
    activo: true,
    password_hash: bcrypt.hashSync("PasswordDeEjemplo1", 4),
    rol: "usuario",
    ...overrides,
  };
}

describe("authService.login", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("contraseña válida → payload con rol correcto", async () => {
    queryMock.mockResolvedValue({ rows: [userRow()], rowCount: 1 } as never);

    const result = await login("alumno@itsx.mx", "PasswordDeEjemplo1");

    expect(result.user).toEqual({ id: 3, nombre: "Ana López", correo: "alumno@itsx.mx", rol: "usuario" });

    const payload = jwt.verify(result.token, env.JWT_SECRET) as jwt.JwtPayload;
    expect(payload.sub).toBe(3);
    expect(payload.rol).toBe("usuario");
  });

  it("correo inexistente → 401 genérico", async () => {
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 } as never);
    await expect(login("no@existe.mx", "PasswordDeEjemplo1")).rejects.toMatchObject({ status: 401 });
  });

  it("contraseña incorrecta → 401 genérico (no revela existencia)", async () => {
    queryMock.mockResolvedValue({ rows: [userRow()], rowCount: 1 } as never);
    await expect(login("alumno@itsx.mx", "mala")).rejects.toMatchObject({ status: 401 });
  });

  it("los dos errores 401 usan el mismo mensaje", async () => {
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);
    const e1 = await login("no@existe.mx", "PasswordDeEjemplo1").catch((e: ApiError) => e);
    queryMock.mockResolvedValueOnce({ rows: [userRow()], rowCount: 1 } as never);
    const e2 = await login("alumno@itsx.mx", "mala").catch((e: ApiError) => e);
    expect((e1 as ApiError).message).toBe((e2 as ApiError).message);
  });

  it("cuenta desactivada → 403", async () => {
    queryMock.mockResolvedValue({ rows: [userRow({ activo: false })], rowCount: 1 } as never);
    await expect(login("alumno@itsx.mx", "PasswordDeEjemplo1")).rejects.toMatchObject({ status: 403 });
  });

  it("admin recibe rol administrador en el token", async () => {
    queryMock.mockResolvedValue({
      rows: [userRow({ rol: "administrador", correo: "admin@itsx.mx" })],
      rowCount: 1,
    } as never);
    const result = await login("admin@itsx.mx", "PasswordDeEjemplo1");
    const payload = jwt.verify(result.token, env.JWT_SECRET) as jwt.JwtPayload;
    expect(payload.rol).toBe("administrador");
  });
});
