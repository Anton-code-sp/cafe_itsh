import { describe, expect, it, vi } from "vitest";
import { formatOrderNumber, generateOrderNumber } from "./orderNumber.js";

describe("formatOrderNumber", () => {
  it("formatea el folio con secuencia de 4 dígitos", () => {
    expect(formatOrderNumber("20261012", 1)).toBe("PED-20261012-0001");
    expect(formatOrderNumber("20261012", 42)).toBe("PED-20261012-0042");
  });

  it("rechaza fecha inválida", () => {
    expect(() => formatOrderNumber("2026-10-12", 1)).toThrow("Fecha inválida");
    expect(() => formatOrderNumber("2026101", 1)).toThrow("Fecha inválida");
  });

  it("rechaza secuencia inválida", () => {
    expect(() => formatOrderNumber("20261012", 0)).toThrow("Secuencia inválida");
    expect(() => formatOrderNumber("20261012", 1.5)).toThrow("Secuencia inválida");
  });
});

describe("generateOrderNumber", () => {
  it("devuelve el folio cuando la inserción no colisiona", async () => {
    const fetchNextSeq = vi.fn().mockResolvedValue(1);
    const tryInsert = vi.fn().mockResolvedValue(true);

    const numero = await generateOrderNumber("20261012", fetchNextSeq, tryInsert);

    expect(numero).toBe("PED-20261012-0001");
    expect(tryInsert).toHaveBeenCalledTimes(1);
  });

  it("reintenta ante colisión de UNIQUE y usa la nueva secuencia", async () => {
    const fetchNextSeq = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const tryInsert = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const numero = await generateOrderNumber("20261012", fetchNextSeq, tryInsert);

    expect(numero).toBe("PED-20261012-0002");
    expect(tryInsert).toHaveBeenCalledTimes(2);
  });

  it("agota los intentos y lanza el último error", async () => {
    const fetchNextSeq = vi.fn().mockResolvedValue(1);
    const tryInsert = vi.fn().mockResolvedValue(false);

    await expect(generateOrderNumber("20261012", fetchNextSeq, tryInsert, 3)).rejects.toThrow(
      "Colisión de folio",
    );
    expect(tryInsert).toHaveBeenCalledTimes(3);
  });
});
