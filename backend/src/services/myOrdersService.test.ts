import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn() },
}));

import { pool } from "../db/pool.js";
import { getMine, getNotificationsForOrder, listMine } from "./myOrdersService.js";

const queryMock = vi.mocked(pool.query);

beforeEach(() => queryMock.mockReset());

describe("myOrdersService.listMine", () => {
  it("solo consulta pedidos del dueño y los devuelve con estado (T005)", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
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

    const result = await listMine(7);

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain("WHERE p.usuario_id = $1");
    expect(sql).toContain("ORDER BY p.creado_en DESC");
    expect(params).toEqual([7]);
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0]).toMatchObject({
      numero: "PED-20261110-0001",
      estado: "Listo",
      total: "90.00",
    });
  });

  it("sin pedidos → lista vacía", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const result = await listMine(7);
    expect(result.orders).toEqual([]);
  });
});

describe("myOrdersService.getMine", () => {
  it("dueño: devuelve pedido, items e historial ordenado (T006)", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          { id: 9, numero: "PED-20261110-0001", tipo: "anticipado", estado: "Listo", total: "90.00", usuario_id: 7 },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ nombre: "Gordita de chicharrón", cantidad: 2, subtotal: "70.00" }],
      })
      .mockResolvedValueOnce({
        rows: [
          { estado: "Pagado", en: "2026-11-10T12:21:00" },
          { estado: "En preparación", en: "2026-11-10T12:30:00" },
          { estado: "Listo", en: "2026-11-10T12:35:00" },
        ],
      });

    const result = await getMine(9, 7);

    expect(result.order).toMatchObject({ numero: "PED-20261110-0001", estado: "Listo" });
    expect(result.items).toHaveLength(1);
    expect(result.historial.map((h) => h.estado)).toEqual([
      "Pagado",
      "En preparación",
      "Listo",
    ]);

    const historialSql = queryMock.mock.calls[2][0] as string;
    expect(historialSql).toContain("ORDER BY h.fecha, h.id");
  });

  it("pedido de otro usuario → error de permiso", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        { id: 9, numero: "PED-1", tipo: "anticipado", estado: "Listo", total: "90.00", usuario_id: 8 },
      ],
    });

    await expect(getMine(9, 7)).rejects.toThrow("No tienes permiso");
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("pedido inexistente → 404", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(getMine(9999, 7)).rejects.toThrow("Pedido no encontrado");
  });
});

describe("myOrdersService.getNotificationsForOrder", () => {
  it("dueño: lista los avisos del pedido con asunto y estado", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          { id: 9, numero: "PED-1", tipo: "anticipado", estado: "Listo", total: "90.00", usuario_id: 7 },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            canal: "correo",
            asunto: "Tu pedido PED-1 está Listo",
            estadoEnvio: "enviada",
            creadoEn: "2026-11-10T12:35:01",
          },
        ],
      });

    const result = await getNotificationsForOrder(9, 7);

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0]).toMatchObject({
      canal: "correo",
      estadoEnvio: "enviada",
      asunto: "Tu pedido PED-1 está Listo",
    });

    const notifSql = queryMock.mock.calls[1][0] as string;
    expect(notifSql).toContain("FROM notificacion");
    expect(queryMock.mock.calls[1][1]).toEqual([9]);
  });

  it("ajeno → error de permiso sin consultar notificaciones", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        { id: 9, numero: "PED-1", tipo: "anticipado", estado: "Listo", total: "90.00", usuario_id: 8 },
      ],
    });

    await expect(getNotificationsForOrder(9, 7)).rejects.toThrow("No tienes permiso");
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});
