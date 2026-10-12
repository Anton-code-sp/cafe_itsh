import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn() },
}));

import { pool } from "../db/pool.js";
import { createDish, listDishes, updateDish } from "./dishService.js";

const queryMock = vi.mocked(pool.query);

describe("dishService", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("createDish → platillo creado con activo true", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 9,
          nombre: "Torta de piña",
          categoria: "Comida",
          descripcion: null,
          activo: true,
        },
      ],
      rowCount: 1,
    } as never);

    const dish = await createDish({ nombre: "Torta de piña", categoria: "Comida" });
    expect(dish.id).toBe(9);
    expect(dish.activo).toBe(true);

    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("INSERT INTO platillo");
    expect(params[0]).toBe("Torta de piña");
  });

  it("createDish con nombre vacío → 400", async () => {
    await expect(createDish({ nombre: " " })).rejects.toMatchObject({ status: 400 });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("updateDish deshabilitar → activo false", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 3,
          nombre: "Quesadilla",
          categoria: "Comida",
          descripcion: null,
          activo: false,
        },
      ],
      rowCount: 1,
    } as never);

    const dish = await updateDish(3, { activo: false });
    expect(dish.activo).toBe(false);

    const [sql] = queryMock.mock.calls[0] as [string];
    expect(sql).toContain("activo = $1");
  });

  it("updateDish editar nombre → devuelto actualizado", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 3,
          nombre: "Quesadilla de Oaxaca",
          categoria: "Comida",
          descripcion: null,
          activo: true,
        },
      ],
      rowCount: 1,
    } as never);

    const dish = await updateDish(3, { nombre: "Quesadilla de Oaxaca" });
    expect(dish.nombre).toBe("Quesadilla de Oaxaca");
  });

  it("updateDish id inexistente → 404", async () => {
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);
    await expect(updateDish(999, { activo: false })).rejects.toMatchObject({ status: 404 });
  });

  it("updateDish sin campos → 400", async () => {
    await expect(updateDish(1, {})).rejects.toMatchObject({ status: 400 });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("listDishes → filas del catálogo ordenadas", async () => {
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);
    await expect(listDishes()).resolves.toEqual([]);
    const [sql] = queryMock.mock.calls[0] as [string];
    expect(sql).toContain("FROM platillo");
    expect(sql).toContain("ORDER BY nombre");
  });
});
