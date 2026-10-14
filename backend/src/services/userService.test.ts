import { describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn() },
}));

import {
  createOperative,
  listOperatives,
  registerClient,
  updateOperative,
} from "./userService.js";

const queryMock = vi.mocked(pool.query);

describe("userService.registerClient", () => {
  it("correo nuevo → crea con rol usuario", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 4 }], rowCount: 1 } as never)
      .mockResolvedValueOnce({
        rows: [{ id: 5, nombre: "Ana", correo: "a@itsx.mx", activo: true, rol: "usuario" }],
        rowCount: 1,
      } as never);

    const user = await registerClient("Ana", "a@itsx.mx", "PasswordDeEjemplo1");
    expect(user.rol).toBe("usuario");
    expect(user.id).toBe(5);
    const [, params] = queryMock.mock.calls[1] as [string, unknown[]];
    expect(params[2]).not.toBe("PasswordDeEjemplo1");
  });

  it("correo existente → 409", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 4 }], rowCount: 1 } as never)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

    await expect(registerClient("Ana", "a@itsx.mx", "PasswordDeEjemplo1")).rejects.toMatchObject({
      status: 409,
    });
  });

  it("dominio no permitido: 400 sin tocar la BD", async () => {
    queryMock.mockReset();
    await expect(registerClient("Ana", "ana@gmail.com", "PasswordDeEjemplo1")).rejects.toMatchObject({
      status: 400,
    });
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe("userService operativos", () => {
  it("crear cajero → devuelto sin password_hash", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 2 }], rowCount: 1 } as never)
      .mockResolvedValueOnce({
        rows: [{ id: 9, nombre: "Luis", correo: "cajero@itsx.mx", activo: true, rol: "cajero" }],
        rowCount: 1,
      } as never);

    const user = await createOperative("Luis", "cajero@itsx.mx", "PasswordDeEjemplo1", "cajero");
    expect(user.rol).toBe("cajero");
    expect(user).not.toHaveProperty("password_hash");
    void bcrypt;
  });

  it("correo duplicado en operativo → 409", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 2 }], rowCount: 1 } as never)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

    await expect(
      createOperative("Luis", "cajero@itsx.mx", "PasswordDeEjemplo1", "cajero"),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("listOperatives retorna filas", async () => {
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 } as never);
    await expect(listOperatives()).resolves.toEqual([]);
  });

  it("updateOperative sin cambios → 404 (sin campos)", async () => {
    await expect(updateOperative(1, {})).rejects.toMatchObject({ status: 404 });
  });

  it("updateOperative id inexistente → 404", async () => {
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 } as never);
    await expect(updateOperative(999, { activo: false })).rejects.toMatchObject({
      status: 404,
    });
  });
});
