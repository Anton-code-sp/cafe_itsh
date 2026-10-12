import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

import { pool } from "../db/pool.js";
import { confirmPayment, createPayment } from "./paymentService.js";

const queryMock = vi.mocked(pool.query);
const connectMock = vi.mocked(pool.connect);

function mockClient(queries: Array<{ rows?: unknown[]; rowCount?: number }>) {
  const client = {
    query: vi.fn(),
    release: vi.fn(),
  };
  let call = 0;
  client.query.mockImplementation(async () => {
    const result = queries[Math.min(call, queries.length - 1)];
    call += 1;
    return { rows: result?.rows ?? [], rowCount: result?.rowCount ?? 0 };
  });
  return client;
}

describe("paymentService.createPayment (sandbox)", () => {
  it("devuelve referencia sandbox y estado pending", async () => {
    const intent = await createPayment(9, 9000);
    expect(intent.reference).toMatch(/^pay_sandbox_[0-9a-f]{12}$/);
    expect(intent.status).toBe("pending");
  });
});

describe("paymentService.confirmPayment", () => {
  beforeEach(() => {
    queryMock.mockReset();
    connectMock.mockReset();
  });

  it("confirma pago: pedido Pagado + fila en pago + historial", async () => {
    const client = mockClient([
      { rows: [], rowCount: 0 }, // BEGIN
      { rows: [{ id: 9, numero: "PED-20261012-0001", estado: "Pendiente", total: "90.00", estado_id: 1 }] },
      { rows: [{ id: 2 }] },
      { rows: [{ 1: 1 }] },
      { rows: [], rowCount: 1 },
      { rows: [], rowCount: 1 },
      { rows: [], rowCount: 1 },
      { rows: [], rowCount: 1 }, // COMMIT
    ]);
    connectMock.mockResolvedValue(client as never);

    const result = await confirmPayment(9);

    expect(result.order.estado).toBe("Pagado");
    expect(result.order.total).toBe("90.00");
    expect(result.pago.monto).toBe("90.00");
    expect(result.pago.referencia).toMatch(/^pay_sandbox_/);

    const sqls = client.query.mock.calls.map((c) => c[0] as string);
    expect(sqls[0]).toContain("BEGIN");
    expect(sqls).toContain("COMMIT");
    expect(sqls.some((s) => s.includes("INSERT INTO pago"))).toBe(true);
    expect(sqls.some((s) => s.includes("UPDATE pedido SET estado_id"))).toBe(true);
    expect(sqls.some((s) => s.includes("pedido_estado_historial"))).toBe(true);
  });

  it("pedido inexistente → 404", async () => {
    const client = mockClient([{ rows: [] }]);
    connectMock.mockResolvedValue(client as never);

    await expect(confirmPayment(999)).rejects.toThrow("Pedido no encontrado");
    expect(client.query.mock.calls.some((c) => (c[0] as string).includes("ROLLBACK"))).toBe(true);
  });

  it("doble confirmación → 409 con estado actual", async () => {
    const client = mockClient([
      { rows: [{ id: 9, numero: "PED-20261012-0001", estado: "Pagado", total: "90.00", estado_id: 2 }] },
    ]);
    connectMock.mockResolvedValue(client as never);

    await expect(confirmPayment(9)).rejects.toThrow("ya no está pendiente");
    expect(client.query.mock.calls.some((c) => (c[0] as string).includes("ROLLBACK"))).toBe(true);
  });
});
