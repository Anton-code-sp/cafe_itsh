import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn() },
}));

import { pool } from "../db/pool.js";
import { getSalesReport } from "./reportService.js";

const queryMock = vi.mocked(pool.query);

beforeEach(() => queryMock.mockReset());

describe("reportService.getSalesReport", () => {
  it("agrupa por estado y por tipo con montos consistentes (T016)", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        { estado: "Cancelado", tipo: "anticipado", pedidos: 1, monto: "35.00" },
        { estado: "Entregado", tipo: "anticipado", pedidos: 2, monto: "70.00" },
        { estado: "Entregado", tipo: "mostrador", pedidos: 3, monto: "105.00" },
      ],
    });

    const report = await getSalesReport("2026-11-01", "2026-11-30");

    expect(report.rango).toEqual({ desde: "2026-11-01", hasta: "2026-11-30" });
    expect(report.resumen).toEqual({ pedidos: 6, monto: "210.00" });

    expect(report.porEstado).toEqual([
      { estado: "Cancelado", pedidos: 1, monto: "35.00" },
      { estado: "Entregado", pedidos: 5, monto: "175.00" },
    ]);
    expect(report.porTipo).toEqual([
      { tipo: "anticipado", pedidos: 3, monto: "105.00" },
      { tipo: "mostrador", pedidos: 3, monto: "105.00" },
    ]);

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain("GROUP BY e.nombre, p.tipo");
    expect(sql).toContain("p.creado_en >= $1::date");
    expect(params).toEqual(["2026-11-01", "2026-11-30"]);
  });

  it("rango sin pedidos → resumen en ceros y listas vacías", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const report = await getSalesReport("2026-01-01", "2026-01-01");

    expect(report.resumen).toEqual({ pedidos: 0, monto: "0.00" });
    expect(report.porEstado).toEqual([]);
    expect(report.porTipo).toEqual([]);
  });

  it("formato de fecha inválido → 400", async () => {
    await expect(getSalesReport("01/11/2026", "2026-11-30")).rejects.toThrow(
      "Rango inválido",
    );
    await expect(getSalesReport("2026-11-01", "ayer")).rejects.toThrow("Rango inválido");
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("desde posterior a hasta → 400", async () => {
    await expect(getSalesReport("2026-11-30", "2026-11-01")).rejects.toThrow(
      "Rango inválido",
    );
    expect(queryMock).not.toHaveBeenCalled();
  });
});
