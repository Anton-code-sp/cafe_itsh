import { describe, expect, it } from "vitest";
import { checkCutoff, fechaServicio, type CutoffConfig } from "./cutoff.js";

const TZ = "America/Mexico_City";
const config: CutoffConfig = { cutoffTime: "13:00", timeZone: TZ };

function atLocal(y: number, mo: number, d: number, h: number, mi: number, s = 0): Date {
  // Construye el Date de modo que en TZ caiga a la hora local deseada.
  // Mexico City (sin DST desde 2022) es UTC-6.
  return new Date(Date.UTC(y, mo - 1, d, h + 6, mi, s));
}

describe("checkCutoff", () => {
  it("permite con más de 10 minutos de anticipación", () => {
    expect(checkCutoff(atLocal(2026, 10, 12, 12, 0), config)).toEqual({
      ok: true,
      reason: null,
    });
  });

  it("permite exactamente a las 10:00 de anticipación (12:50:00)", () => {
    expect(checkCutoff(atLocal(2026, 10, 12, 12, 50, 0), config).ok).toBe(true);
  });

  it("rechaza a 9:59 de anticipación (12:50:59)", () => {
    const result = checkCutoff(atLocal(2026, 10, 12, 12, 50, 59), config);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe(
      "El pedido debe hacerse con al menos 10 minutos de anticipación",
    );
  });

  it("rechaza en la hora de corte y después", () => {
    expect(checkCutoff(atLocal(2026, 10, 12, 13, 0), config).ok).toBe(false);
    expect(checkCutoff(atLocal(2026, 10, 12, 15, 30), config).ok).toBe(false);
  });

  it("rechaza antes de la hora de corte cuando falta poco", () => {
    expect(checkCutoff(atLocal(2026, 10, 12, 12, 55), config).ok).toBe(false);
  });

  it("usa la zona horaria configurada, no la del proceso", () => {
    // 12:50 UTC = 06:50 en Mexico City → permitido.
    const utcNoonish = new Date(Date.UTC(2026, 9, 12, 12, 50, 0));
    expect(checkCutoff(utcNoonish, config).ok).toBe(true);
  });

  it("rechaza CUTOFF_TIME inválida", () => {
    expect(() => checkCutoff(new Date(), { cutoffTime: "25:00", timeZone: TZ })).toThrow(
      "CUTOFF_TIME inválida",
    );
  });
});

describe("fechaServicio", () => {
  it("devuelve la fecha local YYYY-MM-DD", () => {
    expect(fechaServicio(atLocal(2026, 10, 12, 8, 0), TZ)).toBe("2026-10-12");
    expect(fechaServicio(atLocal(2026, 10, 12, 23, 59), TZ)).toBe("2026-10-12");
  });

  it("cambia de día cerca de medianoche local", () => {
    expect(fechaServicio(atLocal(2026, 10, 13, 0, 0, 30), TZ)).toBe("2026-10-13");
  });
});
