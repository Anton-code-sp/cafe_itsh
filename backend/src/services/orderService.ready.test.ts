import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

vi.mock("./paymentService.js", () => ({
  createPayment: vi.fn(),
}));

vi.mock("../config/env.js", () => ({
  env: {
    CUTOFF_TIME: "23:59",
    TZ: "America/Mexico_City",
  },
}));

import { pool } from "../db/pool.js";
import { deliverOrder, listReadyForPickup } from "./orderService.js";

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

describe("orderService.listReadyForPickup", () => {
  beforeEach(() => queryMock.mockReset());

  it("lista pedidos Listo de ambos orígenes con partidas y cliente", async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 15,
          numero: "PED-20261110-0001",
          tipo: "anticipado",
          total: "70.00",
          cliente_nombre: null,
          usuario_nombre: "María González",
          creado_en: "2026-11-10T11:05:00",
          fecha_recoleccion: "2026-11-10T11:30:00",
          items: [
            { nombre: "Café americano", cantidad: 2 },
            { nombre: "Concha verde", cantidad: 1 },
          ],
        },
        {
          id: 16,
          numero: "MOS-20261110-0002",
          tipo: "mostrador",
          total: "35.00",
          cliente_nombre: "Juan Pérez",
          usuario_nombre: null,
          creado_en: "2026-11-10T11:10:00",
          fecha_recoleccion: null,
          items: [{ nombre: "Agua natural", cantidad: 1 }],
        },
      ],
    } as never);

    const orders = await listReadyForPickup();

    expect(orders).toHaveLength(2);
    expect(orders[0]).toEqual({
      id: 15,
      numero: "PED-20261110-0001",
      tipo: "anticipado",
      total: "70.00",
      clienteNombre: "María González",
      creadoEn: "2026-11-10T11:05:00",
      fechaRecoleccion: "2026-11-10T11:30:00",
      items: [
        { nombre: "Café americano", cantidad: 2 },
        { nombre: "Concha verde", cantidad: 1 },
      ],
    });
    expect(orders[1].clienteNombre).toBe("Juan Pérez");
    expect(orders[1].fechaRecoleccion).toBeNull();

    const sql = queryMock.mock.calls[0][0] as string;
    expect(sql).toContain("'Listo'");
    expect(sql).toContain("ORDER BY p.creado_en ASC");
  });

  it("pedido sin cliente ni dueño → clienteNombre null", async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 17,
          numero: "MOS-20261110-0003",
          tipo: "mostrador",
          total: "20.00",
          cliente_nombre: null,
          usuario_nombre: null,
          creado_en: "2026-11-10T11:20:00",
          fecha_recoleccion: null,
          items: [{ nombre: "Pan dulce", cantidad: 1 }],
        },
      ],
    } as never);

    const orders = await listReadyForPickup();
    expect(orders[0].clienteNombre).toBeNull();
  });
});

describe("orderService.deliverOrder", () => {
  beforeEach(() => connectMock.mockReset());

  it("Listo → Entregado: actualiza estado y registra historial", async () => {
    const client = mockClient([
      { rows: [], rowCount: 0 }, // BEGIN
      { rows: [{ id: 15, estado_id: 4, estado: "Listo" }] }, // pedido
      { rows: [{ id: 6 }] }, // estado 'Entregado'
      { rows: [{ "?column?": 1 }] }, // transición existe
      { rows: [], rowCount: 1 }, // UPDATE pedido
      { rows: [], rowCount: 1 }, // INSERT historial
      { rows: [], rowCount: 1 }, // COMMIT
    ]);
    connectMock.mockResolvedValue(client as never);

    const result = await deliverOrder(15, 4);

    expect(result).toEqual({ id: 15, estado: "Entregado" });

    const sqls = client.query.mock.calls.map((c) => c[0] as string);
    expect(sqls.some((s) => s.includes("UPDATE pedido SET estado_id"))).toBe(true);
    expect(sqls).toContain("COMMIT");
  });

  it("pedido Pagado (sin estar Listo) → 409 sin UPDATE", async () => {
    const client = mockClient([
      { rows: [], rowCount: 0 }, // BEGIN
      { rows: [{ id: 15, estado_id: 2, estado: "Pagado" }] }, // pedido
      { rows: [{ id: 6 }] }, // estado 'Entregado'
      { rows: [] }, // transición NO existe
      { rows: [], rowCount: 0 }, // ROLLBACK
    ]);
    connectMock.mockResolvedValue(client as never);

    await expect(deliverOrder(15, 4)).rejects.toThrow("La operación no está permitida");

    const sqls = client.query.mock.calls.map((c) => c[0] as string);
    expect(sqls.some((s) => s.includes("UPDATE pedido SET estado_id"))).toBe(false);
    expect(sqls.some((s) => s.includes("ROLLBACK"))).toBe(true);
    expect(sqls).not.toContain("COMMIT");
  });

  it("pedido inexistente → 404", async () => {
    const client = mockClient([
      { rows: [], rowCount: 0 }, // BEGIN
      { rows: [] }, // pedido no existe
      { rows: [], rowCount: 0 }, // ROLLBACK
    ]);
    connectMock.mockResolvedValue(client as never);

    await expect(deliverOrder(9999, 4)).rejects.toThrow("Pedido no encontrado");
  });
});
