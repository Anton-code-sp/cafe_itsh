import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

vi.mock("../services/kitchenService.js", () => ({
  getKitchenQueue: vi.fn(),
  startOrder: vi.fn(),
  readyOrder: vi.fn(),
}));

import { pool } from "../db/pool.js";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { getKitchenQueue, readyOrder, startOrder } from "../services/kitchenService.js";

const queryMock = vi.mocked(pool.query);
const getQueueMock = vi.mocked(getKitchenQueue);
const startMock = vi.mocked(startOrder);
const readyMock = vi.mocked(readyOrder);

let server: Server;
let base: string;

function token(sub: number, rol = "usuario"): string {
  return jwt.sign({ sub, rol, nombre: "Test" }, env.JWT_SECRET, { expiresIn: "1h" });
}

describe("kitchenRoutes permisos", () => {
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
    getQueueMock.mockReset();
    startMock.mockReset();
    readyMock.mockReset();
  });

  it("GET /api/kitchen/orders sin sesión → 401", async () => {
    const res = await fetch(`${base}/api/kitchen/orders`);
    expect(res.status).toBe(401);
    expect(getQueueMock).not.toHaveBeenCalled();
  });

  it("GET /api/kitchen/orders como cajero → 403", async () => {
    const res = await fetch(`${base}/api/kitchen/orders`, {
      headers: { Authorization: `Bearer ${token(4, "cajero")}` },
    });
    expect(res.status).toBe(403);
    expect(getQueueMock).not.toHaveBeenCalled();
  });

  it("POST /kitchen/orders/:id/start como cajero → 403", async () => {
    const res = await fetch(`${base}/api/kitchen/orders/15/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token(4, "cajero")}` },
    });
    expect(res.status).toBe(403);
    expect(startMock).not.toHaveBeenCalled();
  });

  it("POST /kitchen/orders/:id/ready como alumno → 403", async () => {
    const res = await fetch(`${base}/api/kitchen/orders/15/ready`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token(2, "alumno")}` },
    });
    expect(res.status).toBe(403);
    expect(readyMock).not.toHaveBeenCalled();
  });

  it("GET /api/kitchen/orders como cocinero → 200 con orders", async () => {
    getQueueMock.mockResolvedValue([]);

    const res = await fetch(`${base}/api/kitchen/orders`, {
      headers: { Authorization: `Bearer ${token(3, "cocinero")}` },
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { orders: unknown[] };
    expect(Array.isArray(json.orders)).toBe(true);
    expect(getQueueMock).toHaveBeenCalledTimes(1);
  });

  it("POST /kitchen/orders/:id/start como cocinero → 200", async () => {
    startMock.mockResolvedValue({ id: 15, estado: "En preparación" });

    const res = await fetch(`${base}/api/kitchen/orders/15/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token(3, "cocinero")}` },
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { order: { estado: string } };
    expect(json.order.estado).toBe("En preparación");
    expect(startMock).toHaveBeenCalledWith(15, 3);
  });

  it("POST /kitchen/orders/:id/ready como cocinero → 200", async () => {
    readyMock.mockResolvedValue({ id: 15, estado: "Listo" });

    const res = await fetch(`${base}/api/kitchen/orders/15/ready`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token(3, "cocinero")}` },
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { order: { estado: string } };
    expect(json.order.estado).toBe("Listo");
    expect(readyMock).toHaveBeenCalledWith(15, 3);
  });

  it("POST /kitchen/orders/abc/start → 400 (id inválido)", async () => {
    const res = await fetch(`${base}/api/kitchen/orders/abc/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token(3, "cocinero")}` },
    });
    expect(res.status).toBe(400);
    expect(startMock).not.toHaveBeenCalled();
  });
});
