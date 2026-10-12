import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import type { Server } from "node:http";
import { env } from "../config/env.js";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn(), end: vi.fn() },
}));

import { pool } from "../db/pool.js";
import { createApp } from "../app.js";
import { seedUsers } from "./seedUsers.js";

const queryMock = vi.mocked(pool.query);

function token(rol: string) {
  return jwt.sign({ sub: 1, rol, nombre: "Test" }, env.JWT_SECRET, { expiresIn: "1h" });
}

async function startApp() {
  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("sin puerto");
  const base = `http://localhost:${address.port}`;
  return { server, base };
}

describe("GET /api/users (requireRole en endpoints)", () => {
  let server: Server;
  let base: string;

  beforeEach(async () => {
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 } as never);
    ({ server, base } = await startApp());
  });

  afterEach(() => {
    server?.close();
  });

  it("sin token → 401", async () => {
    const res = await fetch(`${base}/api/users`);
    expect(res.status).toBe(401);
  });

  it("cocinero → 403", async () => {
    const res = await fetch(`${base}/api/users`, {
      headers: { Authorization: `Bearer ${token("cocinero")}` },
    });
    expect(res.status).toBe(403);
  });

  it("admin → 200 con lista de usuarios", async () => {
    queryMock.mockResolvedValue({
      rows: [{ id: 1, nombre: "Admin", correo: "admin@itsx.mx", activo: true, rol: "administrador" }],
      rowCount: 1,
    } as never);

    const res = await fetch(`${base}/api/users`, {
      headers: { Authorization: `Bearer ${token("administrador")}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { users: unknown[] };
    expect(body.users).toHaveLength(1);
  });
});

describe("seedUsers idempotente", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("segunda corrida no duplica (DO NOTHING → rowCount 0)", async () => {
    queryMock.mockImplementation((async (sql: string, params?: unknown[]) => {
      if (sql.includes("FROM rol")) {
        return { rows: [{ id: 1 }], rowCount: 1 };
      }
      if (sql.includes("ON CONFLICT")) {
        void params;
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    }) as never);

    const result = await seedUsers();
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(3);
  });

  it("primera corrida crea las cuentas", async () => {
    queryMock.mockImplementation((async (sql: string) => {
      if (sql.includes("FROM rol")) {
        return { rows: [{ id: 1 }], rowCount: 1 };
      }
      return { rows: [{ id: 1 }], rowCount: 1 };
    }) as never);

    const result = await seedUsers();
    expect(result.created).toBe(3);
  });
});
