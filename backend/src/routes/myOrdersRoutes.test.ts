import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

vi.mock("../services/myOrdersService.js", () => ({
  listMine: vi.fn(),
  getMine: vi.fn(),
  getNotificationsForOrder: vi.fn(),
}));

import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { forbidden } from "../errors.js";
import { getMine, getNotificationsForOrder, listMine } from "../services/myOrdersService.js";

const listMineMock = vi.mocked(listMine);
const getMineMock = vi.mocked(getMine);
const getNotificationsMock = vi.mocked(getNotificationsForOrder);

let server: Server;
let base: string;

function token(sub: number, rol = "usuario"): string {
  return jwt.sign({ sub, rol, nombre: "Ana" }, env.JWT_SECRET, { expiresIn: "1h" });
}

describe("myOrdersRoutes permisos", () => {
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
    listMineMock.mockReset();
    getMineMock.mockReset();
    getNotificationsMock.mockReset();
  });

  it("GET /api/my-orders sin sesión → 401", async () => {
    const res = await fetch(`${base}/api/my-orders`);
    expect(res.status).toBe(401);
    expect(listMineMock).not.toHaveBeenCalled();
  });

  it("GET /api/my-orders propio → 200 con la lista", async () => {
    listMineMock.mockResolvedValue({
      orders: [
        {
          id: 9,
          numero: "PED-20261110-0001",
          tipo: "anticipado",
          estado: "Listo",
          total: "90.00",
          creadoEn: "2026-11-10T12:20:00",
          fechaRecoleccion: "2026-11-10T13:00:00",
        },
      ],
    });

    const res = await fetch(`${base}/api/my-orders`, {
      headers: { Authorization: `Bearer ${token(1)}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { orders: Array<{ numero: string }> };
    expect(body.orders[0].numero).toBe("PED-20261110-0001");
    expect(listMineMock).toHaveBeenCalledWith(1);
  });

  it("GET /api/my-orders/:id sin sesión → 401", async () => {
    const res = await fetch(`${base}/api/my-orders/9`);
    expect(res.status).toBe(401);
    expect(getMineMock).not.toHaveBeenCalled();
  });

  it("GET /api/my-orders/:id de otro usuario → 403 (T007)", async () => {
    getMineMock.mockRejectedValue(forbidden("No tienes permiso para ver este pedido"));

    const res = await fetch(`${base}/api/my-orders/9`, {
      headers: { Authorization: `Bearer ${token(2)}` },
    });

    expect(res.status).toBe(403);
  });

  it("GET /api/my-orders/:id propio → 200 con detalle", async () => {
    getMineMock.mockResolvedValue({
      order: { id: 9, numero: "PED-20261110-0001", tipo: "anticipado", estado: "Listo", total: "90.00" },
      items: [{ nombre: "Gordita de chicharrón", cantidad: 2, subtotal: "70.00" }],
      historial: [{ estado: "Listo", en: "2026-11-10T12:35:00" }],
    });

    const res = await fetch(`${base}/api/my-orders/9`, {
      headers: { Authorization: `Bearer ${token(1)}` },
    });

    expect(res.status).toBe(200);
    expect(getMineMock).toHaveBeenCalledWith(9, 1);
    const body = (await res.json()) as { historial: unknown[] };
    expect(body.historial).toHaveLength(1);
  });

  it("GET /api/my-orders/:id/notifications sin sesión → 401", async () => {
    const res = await fetch(`${base}/api/my-orders/9/notifications`);
    expect(res.status).toBe(401);
    expect(getNotificationsMock).not.toHaveBeenCalled();
  });

  it("GET /api/my-orders/:id/notifications ajeno → 403", async () => {
    getNotificationsMock.mockRejectedValue(
      forbidden("No tienes permiso para ver este pedido"),
    );

    const res = await fetch(`${base}/api/my-orders/9/notifications`, {
      headers: { Authorization: `Bearer ${token(2)}` },
    });

    expect(res.status).toBe(403);
  });

  it("GET /api/my-orders/:id/notifications dueño → 200", async () => {
    getNotificationsMock.mockResolvedValue({
      notifications: [
        {
          canal: "correo",
          asunto: "Tu pedido PED-20261110-0001 está Listo",
          estadoEnvio: "enviada",
          creadoEn: "2026-11-10T12:35:01",
        },
      ],
    });

    const res = await fetch(`${base}/api/my-orders/9/notifications`, {
      headers: { Authorization: `Bearer ${token(1)}` },
    });

    expect(res.status).toBe(200);
    expect(getNotificationsMock).toHaveBeenCalledWith(9, 1);
  });
});
