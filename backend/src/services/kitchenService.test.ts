import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

import { pool } from "../db/pool.js";
import { getKitchenQueue, readyOrder, startOrder } from "./kitchenService.js";

const queryMock = vi.mocked(pool.query);
const connectMock = vi.mocked(pool.connect);

function mockClient(queries: Array<{ rows?: unknown[]; rowCount?: number }>) {
  const client = { query: vi.fn(), release: vi.fn() };
  let call = 0;
  client.query.mockImplementation(async () => {
    const result = queries[Math.min(call, queries.length - 1)];
    call += 1;
    return { rows: result?.rows ?? [], rowCount: result?.rowCount ?? 0 };
  });
  return client;
}

describe("kitchenService.getKitchenQueue", () => {
  beforeEach(() => {
    queryMock.mockReset();
    connectMock.mockReset();
  });

  it("retorna la cola FIFO mapeando items y minutosEspera", async () => {
    // TO_CHAR devuelve hora naive local del servidor, igual que aquí:
    const naive = (offsetMs: number) => {
      const d = new Date(Date.now() + offsetMs);
      const p = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    };
    const hace15 = naive(-15 * 60_000);
    const ahora = naive(0);
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 9,
          numero: "PED-20261013-0001",
          tipo: "anticipado",
          estado: "Pagado",
          cliente_nombre: "María González",
          creado_en: hace15,
          hora_recoleccion: "11:30",
          items: [{ nombre: "Café americano", cantidad: 1 }],
        },
        {
          id: 15,
          numero: "MOS-20261013-0001",
          tipo: "mostrador",
          estado: "En preparación",
          cliente_nombre: null,
          creado_en: ahora,
          hora_recoleccion: null,
          items: [{ nombre: "Gordita de chicharrón", cantidad: 2 }],
        },
      ],
      rowCount: 2,
    } as never);

    const queue = await getKitchenQueue();

    expect(queue.map((o) => o.id)).toEqual([9, 15]);
    expect(queue[0].estado).toBe("Pagado");
    expect(queue[0].clienteNombre).toBe("María González");
    expect(queue[0].horaRecoleccion).toBe("11:30");
    expect(queue[1].estado).toBe("En preparación");
    expect(queue[1].clienteNombre).toBeNull();
    expect(queue[1].horaRecoleccion).toBeNull();
    expect(queue[0].items).toEqual([{ nombre: "Café americano", cantidad: 1 }]);
    expect(queue[0].minutosEspera).toBeGreaterThanOrEqual(14);
    expect(queue[1].minutosEspera).toBe(0);

    const sql = queryMock.mock.calls[0]?.[0] as string;
    expect(sql).toContain("'Pagado'");
    expect(sql).toContain("'En preparación'");
    expect(sql).toContain("ORDER BY p.creado_en ASC");
    expect(sql).toContain("AS items");
    expect(sql).toContain("hora_recoleccion");
  });

  it("sin pedidos en cocina → lista vacía", async () => {
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

    await expect(getKitchenQueue()).resolves.toEqual([]);
  });
});

describe("kitchenService flujo de cocina", () => {
  beforeEach(() => {
    queryMock.mockReset();
    connectMock.mockReset();
  });

  it("startOrder: Pagado → En preparación inserta historial", async () => {
    const client = mockClient([
      { rows: [] },
      { rows: [{ id: 15, estado_id: 2, estado: "Pagado" }] },
      { rows: [{ id: 3 }] },
      { rows: [{ "?column?": 1 }] },
      { rows: [], rowCount: 1 },
      { rows: [], rowCount: 1 },
      { rows: [], rowCount: 1 },
    ]);
    connectMock.mockResolvedValue(client as never);

    const result = await startOrder(15, 3);

    expect(result).toEqual({ id: 15, estado: "En preparación" });
    const sqls = client.query.mock.calls.map((c) => c[0] as string);
    expect(sqls).toContain("COMMIT");
    const hist = client.query.mock.calls.find((c) =>
      (c[0] as string).includes("pedido_estado_historial"),
    );
    expect(hist?.[1]).toEqual([15, 2, 3, 3]);
  });

  it("startOrder sobre pedido Listo → 409 (sin saltos)", async () => {
    const client = mockClient([
      { rows: [] },
      { rows: [{ id: 15, estado_id: 4, estado: "Listo" }] },
      { rows: [{ id: 3 }] },
      { rows: [] },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 1 },
    ]);
    connectMock.mockResolvedValue(client as never);

    await expect(startOrder(15, 3)).rejects.toThrow(
      "La operación no está permitida: Listo → En preparación",
    );
    const sqls = client.query.mock.calls.map((c) => c[0] as string);
    expect(sqls).toContain("ROLLBACK");
    expect(sqls.some((s) => s.includes("UPDATE pedido SET estado_id"))).toBe(false);
  });

  it("readyOrder: En preparación → Listo", async () => {
    const client = mockClient([
      { rows: [] },
      { rows: [{ id: 15, estado_id: 3, estado: "En preparación" }] },
      { rows: [{ id: 4 }] },
      { rows: [{ "?column?": 1 }] },
      { rows: [], rowCount: 1 },
      { rows: [], rowCount: 1 },
      { rows: [], rowCount: 1 },
    ]);
    connectMock.mockResolvedValue(client as never);

    const result = await readyOrder(15, 3);

    expect(result).toEqual({ id: 15, estado: "Listo" });
    const hist = client.query.mock.calls.find((c) =>
      (c[0] as string).includes("pedido_estado_historial"),
    );
    expect(hist?.[1]).toEqual([15, 3, 4, 3]);
  });

  it("readyOrder sobre pedido Pagado → 409 (sin saltos)", async () => {
    const client = mockClient([
      { rows: [] },
      { rows: [{ id: 15, estado_id: 2, estado: "Pagado" }] },
      { rows: [{ id: 4 }] },
      { rows: [] },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 1 },
    ]);
    connectMock.mockResolvedValue(client as never);

    await expect(readyOrder(15, 3)).rejects.toThrow(
      "La operación no está permitida: Pagado → Listo",
    );
  });
});
