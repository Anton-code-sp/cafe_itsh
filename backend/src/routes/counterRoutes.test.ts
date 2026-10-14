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
  listReadyForPickup: vi.fn(),
  deliverOrder: vi.fn(),
  cancelReadyOrder: vi.fn(),
}));

import { pool } from "../db/pool.js";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { conflict } from "../errors.js";
import {
  cancelReadyOrder,
  createCounterOrder,
  deliverOrder,
  listReadyForPickup,
  listRecentCounterOrders,
  undoCounterOrder,
} from "../services/orderService.js";

const queryMock = vi.mocked(pool.query);
const createCounterOrderMock = vi.mocked(createCounterOrder);
const listRecentMock = vi.mocked(listRecentCounterOrders);
const undoCounterOrderMock = vi.mocked(undoCounterOrder);
const listReadyMock = vi.mocked(listReadyForPickup);
const deliverOrderMock = vi.mocked(deliverOrder);
const cancelReadyOrderMock = vi.mocked(cancelReadyOrder);

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
    listReadyMock.mockReset();
    deliverOrderMock.mockReset();
    cancelReadyOrderMock.mockReset();
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

  it("GET /api/counter/orders/ready como alumno → 403", async () => {
    const res = await fetch(`${base}/api/counter/orders/ready`, {
      headers: { Authorization: `Bearer ${token(2, "alumno")}` },
    });
    expect(res.status).toBe(403);
    expect(listReadyMock).not.toHaveBeenCalled();
  });

  it("GET /api/counter/orders/ready como cajero → 200", async () => {
    listReadyMock.mockResolvedValue([
      {
        id: 15,
        numero: "PED-20261110-0001",
        tipo: "anticipado",
        total: "70.00",
        clienteNombre: "María González",
        creadoEn: "2026-11-10T11:05:00",
        fechaRecoleccion: "2026-11-10T11:30:00",
        items: [{ nombre: "Café americano", cantidad: 2 }],
      },
    ]);

    const res = await fetch(`${base}/api/counter/orders/ready`, {
      headers: { Authorization: `Bearer ${token(4, "cajero")}` },
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { orders: Array<{ id: number; clienteNombre: string }> };
    expect(json.orders).toHaveLength(1);
    expect(json.orders[0].clienteNombre).toBe("María González");
    expect(listReadyMock).toHaveBeenCalledTimes(1);
  });

  it("POST /api/counter/orders/:id/deliver como alumno → 403", async () => {
    const res = await fetch(`${base}/api/counter/orders/15/deliver`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token(2, "alumno")}` },
    });
    expect(res.status).toBe(403);
    expect(deliverOrderMock).not.toHaveBeenCalled();
  });

  it("POST /api/counter/orders/:id/deliver como cajero → 200", async () => {
    deliverOrderMock.mockResolvedValue({ id: 15, estado: "Entregado" });

    const res = await fetch(`${base}/api/counter/orders/15/deliver`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token(4, "cajero")}` },
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { order: { estado: string } };
    expect(json.order.estado).toBe("Entregado");
    expect(deliverOrderMock).toHaveBeenCalledWith(15, 4);
  });

  it("POST /api/counter/orders/:id/deliver con estado inválido → 409", async () => {
    deliverOrderMock.mockRejectedValue(
      conflict("La operación no está permitida: Pagado → Entregado"),
    );

    const res = await fetch(`${base}/api/counter/orders/15/deliver`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token(4, "cajero")}` },
    });

    expect(res.status).toBe(409);
  });

  it("POST /api/counter/orders/:id/cancel como alumno → 403", async () => {
    const res = await fetch(`${base}/api/counter/orders/15/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token(2, "alumno")}` },
    });
    expect(res.status).toBe(403);
    expect(cancelReadyOrderMock).not.toHaveBeenCalled();
  });

  it("POST /api/counter/orders/:id/cancel como cajero → 200", async () => {
    cancelReadyOrderMock.mockResolvedValue({ id: 15, estado: "Cancelado" });

    const res = await fetch(`${base}/api/counter/orders/15/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token(4, "cajero")}` },
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { order: { estado: string } };
    expect(json.order.estado).toBe("Cancelado");
    expect(cancelReadyOrderMock).toHaveBeenCalledWith(15, 4);
  });
});
