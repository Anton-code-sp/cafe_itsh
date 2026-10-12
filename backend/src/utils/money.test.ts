import { describe, expect, it } from "vitest";
import { formatCents, lineTotal, sumCents, toCents } from "./money.js";

describe("toCents", () => {
  it("convierte string de NUMERIC de pg a centavos", () => {
    expect(toCents("35.00")).toBe(3500);
    expect(toCents("70.5")).toBe(7050);
    expect(toCents("70.05")).toBe(7005);
  });

  it("convierte número a centavos", () => {
    expect(toCents(35)).toBe(3500);
    expect(toCents(35.5)).toBe(3550);
  });

  it("maneja negativos", () => {
    expect(toCents("-10.25")).toBe(-1025);
  });

  it("rechaza formatos inválidos", () => {
    expect(() => toCents("abc")).toThrow("inválido");
    expect(() => toCents("10.234")).toThrow("inválido");
    expect(() => toCents("")).toThrow("inválido");
  });
});

describe("formatCents", () => {
  it("formatea con 2 decimales", () => {
    expect(formatCents(7000)).toBe("70.00");
    expect(formatCents(7050)).toBe("70.50");
    expect(formatCents(5)).toBe("0.05");
  });

  it("formatea negativos", () => {
    expect(formatCents(-1025)).toBe("-10.25");
  });
});

describe("lineTotal", () => {
  it("multiplica precio unitario por cantidad", () => {
    expect(lineTotal(3500, 2)).toBe(7000);
    expect(lineTotal(1500, 0)).toBe(0);
  });

  it("rechaza cantidad no entera o negativa", () => {
    expect(() => lineTotal(3500, -1)).toThrow("inválida");
    expect(() => lineTotal(3500, 1.5)).toThrow("inválida");
  });
});

describe("sumCents", () => {
  it("suma subtotales", () => {
    expect(sumCents([7000, 1500])).toBe(8500);
    expect(sumCents([])).toBe(0);
  });
});
