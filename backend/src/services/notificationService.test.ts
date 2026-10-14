import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/pool.js", () => ({
  pool: { query: vi.fn() },
}));

vi.mock("../config/env.js", () => ({
  env: { NOTIFY_CHANNEL: "console" },
}));

import { pool } from "../db/pool.js";
import {
  MAX_ATTEMPTS,
  createAndEnqueue,
  flushPending,
  render,
} from "./notificationService.js";

const queryMock = vi.mocked(pool.query);

function fakeClient() {
  return { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }), release: vi.fn() };
}

describe("notificationService.render", () => {
  it("arma asunto y cuerpo con folio, estado y total", () => {
    const msg = render("MOS-20261110-0001", "Listo", "70.00");
    expect(msg.asunto).toBe("Tu pedido MOS-20261110-0001 está Listo");
    expect(msg.cuerpo).toContain("MOS-20261110-0001");
    expect(msg.cuerpo).toContain("Listo");
    expect(msg.cuerpo).toContain("70.00");
  });

  it("nunca incluye datos sensibles (reglas §8)", () => {
    const msg = render("PED-20261110-0001", "Listo", "35.00");
    const texto = `${msg.asunto} ${msg.cuerpo}`.toLowerCase();
    expect(texto).not.toMatch(/tarjeta|contrase|tel[eé]fono|pago|card/);
  });
});

describe("notificationService.createAndEnqueue", () => {
  it("inserta fila pendiente con tipo pedido_listo en el cliente de la transacción", async () => {
    const client = fakeClient();

    await createAndEnqueue(client as never, {
      usuarioId: 7,
      pedidoId: 15,
      numero: "PED-20261110-0001",
      estado: "Listo",
      total: "70.00",
    });

    expect(client.query).toHaveBeenCalledTimes(1);
    const [sql, params] = client.query.mock.calls[0];
    expect(sql).toContain("INSERT INTO notificacion");
    expect(sql).toContain("pedido_listo");
    expect(params).toEqual([
      7,
      15,
      "Tu pedido PED-20261110-0001 está Listo",
      "Tu pedido PED-20261110-0001 está Listo. Total: $70.00.",
    ]);
  });
});

describe("notificationService.flushPending", () => {
  beforeEach(() => queryMock.mockReset());

  it("marca enviada las filas pendientes y las loguea", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          { id: 1, asunto: "Tu pedido A está Listo", cuerpo: "…", intentos: 0 },
        ],
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await flushPending();

    expect(result).toEqual({ enviadas: 1, fallidas: 0 });
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Tu pedido A está Listo"),
    );
    const update = queryMock.mock.calls[1][0] as string;
    expect(update).toContain("estado_envio = 'enviada'");
    log.mockRestore();
  });

  it(`tras ${MAX_ATTEMPTS} intentos marca fallida sin reintentar`, async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: 2, asunto: "x", cuerpo: "y", intentos: MAX_ATTEMPTS }],
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const result = await flushPending();

    expect(result).toEqual({ enviadas: 0, fallidas: 1 });
    const update = queryMock.mock.calls[1][0] as string;
    expect(update).toContain("estado_envio = 'fallida'");
  });

  it("sin filas pendientes no escribe nada", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const result = await flushPending();
    expect(result).toEqual({ enviadas: 0, fallidas: 0 });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});
