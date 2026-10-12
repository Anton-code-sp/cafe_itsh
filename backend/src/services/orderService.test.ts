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
import { createPayment } from "./paymentService.js";
import { createOrder, quoteOrder } from "./orderService.js";

const queryMock = vi.mocked(pool.query);
const connectMock = vi.mocked(pool.connect);
const createPaymentMock = vi.mocked(createPayment);

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

describe("orderService.quote", () => {
  beforeEach(() => queryMock.mockReset());

  it("calcula total correcto con precios vigentes del servidor", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        { id: 42, nombre: "Gordita de chicharrón", precio: "35.00", disponible: true },
        { id: 45, nombre: "Café de olla", precio: "20.00", disponible: true },
      ],
      rowCount: 2,
    } as never);

    const quote = await quoteOrder([
      { menuDiaId: 42, cantidad: 2 },
      { menuDiaId: 45, cantidad: 1 },
    ]);

    expect(quote.total).toBe("90.00");
    expect(quote.canOrder).toBe(true);
    expect(quote.items).toHaveLength(2);
    expect(quote.items[0]).toMatchObject({ menuDiaId: 42, subtotal: "70.00" });
    expect(quote.items[1]).toMatchObject({ menuDiaId: 45, subtotal: "20.00" });
  });

  it("item no disponible → canOrder false con motivo claro", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 42, nombre: "Gordita de chicharrón", precio: "35.00", disponible: false }],
      rowCount: 1,
    } as never);

    const quote = await quoteOrder([{ menuDiaId: 42, cantidad: 1 }]);

    expect(quote.canOrder).toBe(false);
    expect(quote.reason).toContain("no está disponible");
  });

  it("items vacíos → error 400", async () => {
    await expect(quoteOrder([])).rejects.toThrow("al menos un platillo");
  });
});

describe("orderService.createOrder", () => {
  beforeEach(() => {
    queryMock.mockReset();
    connectMock.mockReset();
    createPaymentMock.mockReset();
    createPaymentMock.mockResolvedValue({ reference: "pay_sandbox_abc123", status: "pending" });
  });

  it("crea pedido Pendiente con precio congelado y total del servidor", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 42, nombre: "Gordita de chicharrón", precio: "35.00", disponible: true }],
      rowCount: 1,
    } as never);

    const client = mockClient([
      { rows: [], rowCount: 0 },                                // BEGIN
      { rows: [{ id: 1 }] },                                    // estado Pendiente
      { rows: [{ seq: 1 }] },                                   // COUNT(*) + 1
      { rows: [], rowCount: 1 },                                // INSERT pedido (tryInsert)
      { rows: [{ id: 9 }] },                                    // SELECT id por numero
      { rows: [], rowCount: 1 },                                // INSERT detalle
      { rows: [], rowCount: 1 },                                // UPDATE total
      { rows: [], rowCount: 1 },                                // INSERT historial
      { rows: [], rowCount: 1 },                                // COMMIT
    ]);
    connectMock.mockResolvedValue(client as never);

    const result = await createOrder(7, [{ menuDiaId: 42, cantidad: 2 }]);

    expect(result.order.estado).toBe("Pendiente");
    expect(result.order.total).toBe("70.00");
    expect(result.order.numero).toMatch(/^PED-\d{8}-0001$/);
    expect(result.payment.reference).toBe("pay_sandbox_abc123");

    const sqls = client.query.mock.calls.map((c) => c[0] as string);
    expect(sqls[0]).toContain("BEGIN");
    expect(sqls.some((s) => s.includes("INSERT INTO pedido"))).toBe(true);
    expect(sqls.some((s) => s.includes("INSERT INTO pedido_detalle"))).toBe(true);
    expect(sqls.some((s) => s.includes("UPDATE pedido SET total"))).toBe(true);
    expect(sqls.some((s) => s.includes("pedido_estado_historial"))).toBe(true);
    expect(sqls).toContain("COMMIT");
  });

  it("platillo no disponible → 409 antes de tocar la transacción", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 42, nombre: "Gordita de chicharrón", precio: "35.00", disponible: false }],
      rowCount: 1,
    } as never);

    await expect(createOrder(7, [{ menuDiaId: 42, cantidad: 1 }])).rejects.toThrow(
      "no está disponible",
    );
    expect(connectMock).not.toHaveBeenCalled();
  });
});

describe("orderService ventana de corte", () => {
  it("fuera de ventana → rechazo con mensaje claro (mockeando cutoff)", async () => {
    // CUTOFF_TIME en env mock = 23:59; con la hora real suele estar en ventana.
    // Para probar el rechazo cambiamos el mock de cutoff.
    vi.resetModules();
    vi.doMock("../utils/cutoff.js", () => ({
      checkCutoff: () => ({
        ok: false,
        reason: "El pedido debe hacerse con al menos 10 minutos de anticipación",
      }),
      fechaServicio: () => "20261012",
    }));

    const { createOrder: createOrderFresh } = await import("./orderService.js");

    await expect(createOrderFresh(7, [{ menuDiaId: 42, cantidad: 1 }])).rejects.toThrow(
      "al menos 10 minutos",
    );

    vi.doUnmock("../utils/cutoff.js");
    vi.resetModules();
  });
});
