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
import { transitionOrder } from "./orderService.js";

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

describe("orderService.transitionOrder", () => {
  beforeEach(() => connectMock.mockReset());

  it("transición válida: actualiza el estado y registra historial", async () => {
    const client = mockClient([
      { rows: [], rowCount: 0 },                    // BEGIN
      { rows: [{ id: 15, estado_id: 2, estado: "Pagado" }] }, // pedido
      { rows: [{ id: 3 }] },                        // estado 'En preparación'
      { rows: [{ "?column?": 1 }] },                // transición existe
      { rows: [], rowCount: 1 },                    // UPDATE pedido
      { rows: [], rowCount: 1 },                    // INSERT historial
      { rows: [], rowCount: 1 },                    // COMMIT
    ]);
    connectMock.mockResolvedValue(client as never);

    const result = await transitionOrder(15, "En preparación", 4);

    expect(result).toEqual({ id: 15, estado: "En preparación" });

    const sqls = client.query.mock.calls.map((c) => c[0] as string);
    expect(sqls[0]).toContain("BEGIN");
    expect(sqls.some((s) => s.includes("FROM transicion_estado"))).toBe(true);
    expect(sqls.some((s) => s.includes("UPDATE pedido SET estado_id"))).toBe(true);
    expect(sqls.some((s) => s.includes("pedido_estado_historial"))).toBe(true);
    expect(sqls).toContain("COMMIT");

    const historialCall = client.query.mock.calls.find((c) =>
      (c[0] as string).includes("pedido_estado_historial"),
    );
    expect(historialCall?.[1]).toEqual([15, 2, 3, 4]);
  });

  it("transición inválida (salta estados) → 409 con mensaje claro, sin UPDATE", async () => {
    const client = mockClient([
      { rows: [], rowCount: 0 },                    // BEGIN
      { rows: [{ id: 15, estado_id: 2, estado: "Pagado" }] }, // pedido
      { rows: [{ id: 5 }] },                        // estado 'Listo'
      { rows: [] },                                 // transición NO existe
      { rows: [], rowCount: 0 },                    // ROLLBACK
    ]);
    connectMock.mockResolvedValue(client as never);

    await expect(transitionOrder(15, "Listo", 4)).rejects.toThrow(
      "La operación no está permitida",
    );

    const sqls = client.query.mock.calls.map((c) => c[0] as string);
    expect(sqls.some((s) => s.includes("UPDATE pedido SET estado_id"))).toBe(false);
    expect(sqls.some((s) => s.includes("ROLLBACK"))).toBe(true);
    expect(sqls).not.toContain("COMMIT");
  });

  it("pedido inexistente → 404", async () => {
    const client = mockClient([
      { rows: [], rowCount: 0 }, // BEGIN
      { rows: [] },              // pedido no existe
      { rows: [], rowCount: 0 }, // ROLLBACK
    ]);
    connectMock.mockResolvedValue(client as never);

    await expect(transitionOrder(9999, "En preparación", 4)).rejects.toThrow(
      "Pedido no encontrado",
    );
  });

  it("Entregado/Cancelado no tienen transiciones salientes → 409", async () => {
    const client = mockClient([
      { rows: [], rowCount: 0 },                       // BEGIN
      { rows: [{ id: 15, estado_id: 6, estado: "Entregado" }] },
      { rows: [{ id: 3 }] },                           // estado destino
      { rows: [] },                                    // sin transición saliente
      { rows: [], rowCount: 0 },                       // ROLLBACK
    ]);
    connectMock.mockResolvedValue(client as never);

    await expect(transitionOrder(15, "En preparación", 4)).rejects.toThrow(
      "La operación no está permitida",
    );
  });
});
