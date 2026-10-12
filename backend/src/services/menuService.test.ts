import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn() },
}));

import { pool } from "../db/pool.js";
import { getMenuByDate } from "./menuService.js";

const queryMock = vi.mocked(pool.query);

describe("menuService.getMenuByDate", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("fecha con menú → items con join de catálogo y especiales primero", async () => {
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

    const menu = await getMenuByDate("2026-10-13");

    expect(menu.fecha).toBe("2026-10-13");
    expect(menu.items).toHaveLength(1);
    expect(menu.items[0]).toEqual({
      id: 7,
      nombre: "Café de olla",
      categoria: "Bebida",
      descripcion: "Café de olla con piloncillo y canela",
      precio: "20.00",
      disponible: true,
      especial: true,
    });

    const itemsSql = queryMock.mock.calls[1][0] as string;
    expect(itemsSql).toContain("p.activo = TRUE");
    expect(itemsSql).toContain("md.especial DESC");
    expect(itemsSql).toContain("JOIN platillo p");
  });

  it("solo platillos activos del catálogo (filtro activo en SQL)", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ fecha: "2026-10-13" }], rowCount: 1 } as never)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

    await getMenuByDate("2026-10-13");

    const itemsSql = queryMock.mock.calls[1][0] as string;
    expect(itemsSql).toMatch(/p\.activo\s*=\s*TRUE/);
  });

  it("sin fecha → usa CURRENT_DATE con parámetro nulo", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ fecha: "2026-10-12" }], rowCount: 1 } as never)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

    const menu = await getMenuByDate();

    expect(menu.fecha).toBe("2026-10-12");
    expect(menu.items).toEqual([]);

    const [, params] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(params[0]).toBeNull();
    const itemsSql = queryMock.mock.calls[1][0] as string;
    expect(itemsSql).toContain("CURRENT_DATE");
  });
});
