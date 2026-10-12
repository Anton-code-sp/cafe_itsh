import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

vi.mock("../services/orderService.js", () => ({
  getOrder: vi.fn(),
  cancelOrder: vi.fn(),
  quoteOrder: vi.fn(),
  createOrder: vi.fn(),
}));

vi.mock("../services/paymentService.js", () => ({
  confirmPayment: vi.fn(),
}));

import { pool } from "../db/pool.js";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { forbidden } from "../errors.js";
import { cancelOrder, getOrder } from "../services/orderService.js";

const queryMock = vi.mocked(pool.query);
const getOrderMock = vi.mocked(getOrder);
const cancelOrderMock = vi.mocked(cancelOrder);

let server: Server;
let base: string;

function token(sub: number, rol = "usuario"): string {
  return jwt.sign({ sub, rol, nombre: "Ana" }, env.JWT_SECRET, { expiresIn: "1h" });
}

describe("orderRoutes permisos", () => {
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
    getOrderMock.mockReset();
    cancelOrderMock.mockReset();
  });

  it("GET /api/orders/:id sin sesión → 401", async () => {
    const res = await fetch(`${base}/api/orders/9`);
    expect(res.status).toBe(401);
    expect(getOrderMock).not.toHaveBeenCalled();
  });

  it("GET /api/orders/:id de otro usuario → 403", async () => {
    getOrderMock.mockRejectedValue(forbidden("No tienes permiso para ver este pedido"));

    const res = await fetch(`${base}/api/orders/9`, {
      headers: { Authorization: `Bearer ${token(2) }` },
    });

    expect(res.status).toBe(403);
  });

  it("GET /api/orders/:id propio → 200", async () => {
    getOrderMock.mockResolvedValue({
      id: 9,
      numero: "PED-20261012-0001",
      estado: "Pendiente",
      total: "90.00",
      items: [],
      pago: null,
    });

    const res = await fetch(`${base}/api/orders/9`, {
      headers: { Authorization: `Bearer ${token(1)}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { numero: string };
    expect(body.numero).toBe("PED-20261012-0001");
  });

  it("POST /api/orders sin sesión → 401", async () => {
    const res = await fetch(`${base}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ menuDiaId: 42, cantidad: 1 }] }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/payments/:orderId/confirm sin sesión → 401", async () => {
    const res = await fetch(`${base}/api/payments/9/confirm`, { method: "POST" });
    expect(res.status).toBe(401);
  });
});
