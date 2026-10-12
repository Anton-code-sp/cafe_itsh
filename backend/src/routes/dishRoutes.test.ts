import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn() },
}));

import { pool } from "../db/pool.js";
import { createApp } from "../app.js";
import { env } from "../config/env.js";

const queryMock = vi.mocked(pool.query);

let server: Server;
let base: string;

function tokenFor(rol: string): string {
  return jwt.sign({ sub: 1, rol, nombre: "Test" }, env.JWT_SECRET, { expiresIn: "1h" });
}

describe("GET /api/dishes (permisos admin)", () => {
  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("No se pudo obtener el puerto del servidor de prueba");
    }
    base = `http://localhost:${address.port}`;
  });

  afterAll(() => {
    server?.close();
  });

  beforeEach(() => {
    queryMock.mockReset();
  });

  it("sin token → 401", async () => {
    const res = await fetch(`${base}/api/dishes`);
    expect(res.status).toBe(401);
  });

  it("cocinero → 403", async () => {
    const res = await fetch(`${base}/api/dishes`, {
      headers: { Authorization: `Bearer ${tokenFor("cocinero")}` },
    });
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("admin → 200 con catálogo", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nombre: "Gordita de chicharrón",
          categoria: "Comida",
          descripcion: null,
          activo: true,
        },
      ],
      rowCount: 1,
    } as never);

    const res = await fetch(`${base}/api/dishes`, {
      headers: { Authorization: `Bearer ${tokenFor("administrador")}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { dishes: unknown[] };
    expect(body.dishes).toHaveLength(1);
  });

  it("admin crear sin nombre → 400", async () => {
    const res = await fetch(`${base}/api/dishes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("administrador")}`,
      },
      body: JSON.stringify({ nombre: "" }),
    });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
