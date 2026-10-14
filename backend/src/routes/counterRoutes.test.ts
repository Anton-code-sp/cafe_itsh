import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

vi.mock("../services/orderService.js", () => ({
  createCounterOrder: vi.fn(),
  listRecentCounterOrders: vi.fn(),
  undoCounterOrder: vi.fn(),
}));

import { pool } from "../db/pool.js";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import {
  createCounterOrder,
  listRecentCounterOrders,
  undoCounterOrder,
} from "../services/orderService.js";

const queryMock = vi.mocked(pool.query);
const createCounterOrderMock = vi.mocked(createCounterOrder);
const listRecentMock = vi.mocked(listRecentCounterOrders);
const undoCounterOrderMock = vi.mocked(undoCounterOrder);

let server: Server;
let base: string;

function token(sub: number, rol = "usuario"): string {
  return jwt.sign({ sub, rol, nombre: "Ana" }, env.JWT_SECRET, { expiresIn: "1h" });
}

const body = JSON.stringify({
  items: [{ menuDiaId: 42, cantidad: 2 }],
  montoRecibido: "100.00",
});

describe("counterRoutes permisos", () => {
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
    createCounterOrderMock.mockReset();
    listRecentMock.mockReset();
    undoCounterOrderMock.mockReset();
  });

  it("POST /api/counter/orders sin sesión → 401", async () => {
    const res = await fetch(`${base}/api/counter/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    expect(res.status).toBe(401);
    expect(createCounterOrderMock).not.toHaveBeenCalled();
  });

  it("POST /api/counter/orders como cocinero → 403", async () => {
    const res = await fetch(`${base}/api/counter/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token(3, "cocinero")}` },
      body,
    });
    expect(res.status).toBe(403);
    expect(createCounterOrderMock).not.toHaveBeenCalled();
  });

  it("GET /api/counter/orders/recent como alumno → 403", async () => {
    const res = await fetch(`${base}/api/counter/orders/recent`, {
      headers: { Authorization: `Bearer ${token(2, "alumno")}` },
    });
    expect(res.status).toBe(403);
    expect(listRecentMock).not.toHaveBeenCalled();
  });

  it("POST /api/counter/orders/:id/undo como alumno → 403", async () => {
    const res = await fetch(`${base}/api/counter/orders/15/undo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token(2, "alumno")}` },
    });
    expect(res.status).toBe(403);
    expect(undoCounterOrderMock).not.toHaveBeenCalled();
  });

  it("POST /api/counter/orders como cajero → 201", async () => {
    createCounterOrderMock.mockResolvedValue({
      order: { id: 15, numero: "MOS-20261013-0001", tipo: "mostrador", estado: "Pagado", total: "70.00" },
      pago: { metodo: "efectivo", monto: "70.00" },
    });

    const res = await fetch(`${base}/api/counter/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token(4, "cajero")}` },
      body,
    });

    expect(res.status).toBe(201);
    const json = (await res.json()) as { order: { estado: string } };
    expect(json.order.estado).toBe("Pagado");
    expect(createCounterOrderMock).toHaveBeenCalledWith(4, [{ menuDiaId: 42, cantidad: 2 }], 100, undefined);
  });

  it("GET /api/counter/orders/recent como cajero → 200", async () => {
    listRecentMock.mockResolvedValue([]);

    const res = await fetch(`${base}/api/counter/orders/recent`, {
      headers: { Authorization: `Bearer ${token(4, "cajero")}` },
    });

    expect(res.status).toBe(200);
    expect(listRecentMock).toHaveBeenCalledTimes(1);
  });

  it("POST /api/counter/orders body inválido → 400", async () => {
    const res = await fetch(`${base}/api/counter/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token(4, "cajero")}` },
      body: JSON.stringify({ items: [] }),
    });
    expect(res.status).toBe(400);
    expect(createCounterOrderMock).not.toHaveBeenCalled();
  });
});
