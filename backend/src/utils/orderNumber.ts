/**
 * Generación del folio de pedido `PED-YYYYMMDD-XXXX` (research R5).
 *
 * La secuencia diaria y la inserción se inyectan para poder reintentar ante
 * una colisión del constraint UNIQUE sin acoplar estas utilidades a la base
 * de datos.
 */

/** Formatea el folio: `PED-20261012-0007`. */
export function formatOrderNumber(ymd: string, seq: number): string {
  if (!/^\d{8}$/.test(ymd)) {
    throw new Error(`Fecha inválida para folio: ${ymd}`);
  }
  if (!Number.isInteger(seq) || seq < 1) {
    throw new Error(`Secuencia inválida: ${seq}`);
  }
  return `PED-${ymd}-${String(seq).padStart(4, "0")}`;
}

/**
 * Genera un folio único. `fetchNextSeq` devuelve el siguiente contador del día
 * (COUNT(*) + 1); `tryInsert` intenta persistir el folio y devuelve false si
 * el constraint UNIQUE lo rechaza (colisión concurrente).
 */
export async function generateOrderNumber(
  ymd: string,
  fetchNextSeq: () => Promise<number>,
  tryInsert: (numero: string) => Promise<boolean>,
  maxAttempts = 10,
): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seq = await fetchNextSeq();
    const numero = formatOrderNumber(ymd, seq);
    const ok = await tryInsert(numero);
    if (ok) return numero;
    lastError = new Error(`Colisión de folio: ${numero}`);
  }

  throw lastError ?? new Error("No se pudo generar un folio único");
}
