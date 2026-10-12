/**
 * Manejo de dinero en centavos enteros. Nunca flotantes: evita errores de
 * redondeo en totales de pedido (research R2).
 */

/** Convierte un valor monetario (entero, decimal o string de NUMERIC de pg) a centavos. */
export function toCents(value: string | number): number {
  const s = typeof value === "number" ? value.toFixed(2) : value.trim();
  const match = s.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) {
    throw new Error(`Valor monetario inválido: ${value}`);
  }
  const [, sign, entero, fracRaw] = match;
  const frac = (fracRaw ?? "").padEnd(2, "0");
  const cents = Number(entero) * 100 + Number(frac);
  return sign === "-" ? -cents : cents;
}

/** Formatea centavos como string con 2 decimales ("70.00"), formato de respuestas. */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Subtotal de una línea: precio unitario en centavos × cantidad. */
export function lineTotal(unitCents: number, cantidad: number): number {
  if (!Number.isInteger(cantidad) || cantidad < 0) {
    throw new Error(`Cantidad inválida: ${cantidad}`);
  }
  return unitCents * cantidad;
}

/** Suma de subtotales en centavos (total del pedido). */
export function sumCents(items: number[]): number {
  return items.reduce((acc, c) => acc + c, 0);
}
