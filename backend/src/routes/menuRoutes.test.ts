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

function alumnoToken(): string {
  return jwt.sign({ sub: 1, rol: "usuario", nombre: "Ana" }, env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

describe("GET /api/menu", () => {
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
    const res = await fetch(`${base}/api/menu`);
    expect(res.status).toBe(401);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("alumno autenticado → 200 con fecha e items", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ fecha: "2026-10-13" }], rowCount: 1 } as never)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 7,
            nombre: "Café de olla",
            categoria: "Bebida",
            descripcion: "Café de olla con piloncillo y canela",
            precio: "20.00",
            disponible: true,
            especial: true,
          },
        ],
        rowCount: 1,
      } as never);

    const res = await fetch(`${base}/api/menu?fecha=2026-10-13`, {
      headers: { Authorization: `Bearer ${alumnoToken()}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { fecha: string; items: unknown[] };
    expect(body.fecha).toBe("2026-10-13");
    expect(body.items).toHaveLength(1);
  });

  it("fecha con formato inválido → 400", async () => {
    const res = await fetch(`${base}/api/menu?fecha=no-es-fecha`, {
      headers: { Authorization: `Bearer ${alumnoToken()}` },
    });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
