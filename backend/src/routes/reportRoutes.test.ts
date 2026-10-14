import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

vi.mock("../services/reportService.js", () => ({
  getSalesReport: vi.fn(),
}));

import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { getSalesReport } from "../services/reportService.js";

const reportMock = vi.mocked(getSalesReport);

let server: Server;
let base: string;

function token(rol: string, sub = 1): string {
  return jwt.sign({ sub, rol, nombre: "Tester" }, env.JWT_SECRET, { expiresIn: "1h" });
}

const query = "desde=2026-11-01&hasta=2026-11-30";

describe("reportRoutes permisos", () => {
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

  beforeEach(() => reportMock.mockReset());

  it("sin sesión → 401", async () => {
    const res = await fetch(`${base}/api/admin/reports/sales?${query}`);
    expect(res.status).toBe(401);
    expect(reportMock).not.toHaveBeenCalled();
  });

  it("rol usuario → 403 (T017)", async () => {
    const res = await fetch(`${base}/api/admin/reports/sales?${query}`, {
      headers: { Authorization: `Bearer ${token("usuario")}` },
    });
    expect(res.status).toBe(403);
    expect(reportMock).not.toHaveBeenCalled();
  });

  it("rol cajero → 403 (T017)", async () => {
    const res = await fetch(`${base}/api/admin/reports/sales?${query}`, {
      headers: { Authorization: `Bearer ${token("cajero")}` },
    });
    expect(res.status).toBe(403);
    expect(reportMock).not.toHaveBeenCalled();
  });

  it("administrador → 200 con el agregado", async () => {
    reportMock.mockResolvedValue({
      rango: { desde: "2026-11-01", hasta: "2026-11-30" },
      resumen: { pedidos: 120, monto: "10540.00" },
      porEstado: [{ estado: "Entregado", pedidos: 80, monto: "7000.00" }],
      porTipo: [{ tipo: "anticipado", pedidos: 90, monto: "8100.00" }],
    });

    const res = await fetch(`${base}/api/admin/reports/sales?${query}`, {
      headers: { Authorization: `Bearer ${token("administrador")}` },
    });

    expect(res.status).toBe(200);
    expect(reportMock).toHaveBeenCalledWith("2026-11-01", "2026-11-30");
    const body = (await res.json()) as { resumen: { pedidos: number } };
    expect(body.resumen.pedidos).toBe(120);
  });

  it("parámetros con formato inválido → 400 (sin llegar al servicio)", async () => {
    const res = await fetch(`${base}/api/admin/reports/sales?desde=ayer&hasta=2026-11-30`, {
      headers: { Authorization: `Bearer ${token("administrador")}` },
    });
    expect(res.status).toBe(400);
    expect(reportMock).not.toHaveBeenCalled();
  });
});
