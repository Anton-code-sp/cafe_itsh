import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn() },
}));

import { pool } from "../db/pool.js";
import {
  getMenuByDate,
  getMenuDayAdmin,
  publishMenuDay,
  updateMenuDayRow,
} from "./menuService.js";

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

describe("menuService publicación y edición (admin)", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("publishMenuDay → fila creada", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 } as never)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 42,
            nombre: "Torta de piña",
            precio: "40.00",
            disponible: true,
            especial: false,
            disponible_en_catalogo: true,
          },
        ],
        rowCount: 1,
      } as never);

    const row = await publishMenuDay("2026-10-13", 5, 40, false);

    expect(row.id).toBe(42);
    expect(row.precio).toBe("40.00");

    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("ON CONFLICT (fecha, platillo_id) DO NOTHING");
    expect(params).toEqual(["2026-10-13", 5, 40, false]);
  });

  it("publishMenuDay duplicado el mismo día → 409", async () => {
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

    await expect(publishMenuDay("2026-10-13", 5, 40, false)).rejects.toMatchObject({
      status: 409,
    });
  });

  it("publishMenuDay precio negativo → 400 (sin tocar la BD)", async () => {
    await expect(publishMenuDay("2026-10-13", 5, -1, false)).rejects.toMatchObject({
      status: 400,
    });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("updateMenuDayRow → fila actualizada", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 7,
            nombre: "Café de olla",
            precio: "22.00",
            disponible: false,
            especial: true,
            disponible_en_catalogo: true,
          },
        ],
        rowCount: 1,
      } as never);

    const row = await updateMenuDayRow(7, { precio: 22, disponible: false, especial: true });
    expect(row.precio).toBe("22.00");
    expect(row.disponible).toBe(false);

    const [sql] = queryMock.mock.calls[0] as [string];
    expect(sql).toContain("UPDATE menu_dia");
  });

  it("updateMenuDayRow id inexistente → 404", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

    await expect(updateMenuDayRow(999, { disponible: false })).rejects.toMatchObject({
      status: 404,
    });
  });

  it("updateMenuDayRow precio negativo → 400 (sin tocar la BD)", async () => {
    await expect(updateMenuDayRow(1, { precio: -5 })).rejects.toMatchObject({
      status: 400,
    });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("getMenuDayAdmin → items con disponible_en_catalogo", async () => {
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

    const menu = await getMenuDayAdmin("2026-10-13");
    expect(menu.fecha).toBe("2026-10-13");
    expect(menu.items[0].disponible_en_catalogo).toBe(true);

    const itemsSql = queryMock.mock.calls[1][0] as string;
    expect(itemsSql).toContain("p.activo AS disponible_en_catalogo");
  });
});
