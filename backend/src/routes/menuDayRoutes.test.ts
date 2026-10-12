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

describe("/api/admin/menu-day (permisos admin)", () => {
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

  it("GET sin token → 401", async () => {
    const res = await fetch(`${base}/api/admin/menu-day`);
    expect(res.status).toBe(401);
  });

  it("GET como cocinero → 403", async () => {
    const res = await fetch(`${base}/api/admin/menu-day`, {
      headers: { Authorization: `Bearer ${tokenFor("cocinero")}` },
    });
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("GET como admin → 200 con filas", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ fecha: "2026-10-13" }], rowCount: 1 } as never)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 7,
            nombre: "Café de olla",
            precio: "20.00",
            disponible: true,
            especial: true,
            disponible_en_catalogo: true,
          },
        ],
        rowCount: 1,
      } as never);

    const res = await fetch(`${base}/api/admin/menu-day?fecha=2026-10-13`, {
      headers: { Authorization: `Bearer ${tokenFor("administrador")}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { fecha: string; items: unknown[] };
    expect(body.fecha).toBe("2026-10-13");
    expect(body.items).toHaveLength(1);
  });

  it("POST como cocinero → 403", async () => {
    const res = await fetch(`${base}/api/admin/menu-day`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("cocinero")}`,
      },
      body: JSON.stringify({ fecha: "2026-10-13", platilloId: 1, precio: 20 }),
    });
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("POST como admin con precio negativo → 400", async () => {
    const res = await fetch(`${base}/api/admin/menu-day`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("administrador")}`,
      },
      body: JSON.stringify({ fecha: "2026-10-13", platilloId: 1, precio: -5 }),
    });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("PATCH como admin con body vacío → 400", async () => {
    const res = await fetch(`${base}/api/admin/menu-day/1`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("administrador")}`,
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
