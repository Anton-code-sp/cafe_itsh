/**
 * Ventana de pedido anticipado (research R1): el pedido debe crearse con al
 * menos 10 minutos antes de `CUTOFF_TIME` en la zona horaria del servidor.
 * El servidor es la única autoridad; el frontend solo muestra el motivo.
 */

export const CUTOFF_WINDOW_MINUTES = 10;

export interface CutoffConfig {
  /** Hora de corte en formato HH:MM (ej. "13:00"). */
  cutoffTime: string;
  /** Zona horaria IANA (ej. "America/Mexico_City"). */
  timeZone: string;
}

export interface CutoffCheck {
  ok: boolean;
  /** Mensaje claro cuando ok=false; null cuando se permite ordenar. */
  reason: string | null;
}

const CUTOFF_MESSAGE =
  "El pedido debe hacerse con al menos 10 minutos de anticipación";

interface ZonedParts {
  /** Fecha local YYYY-MM-DD en la zona dada. */
  dateYmd: string;
  /** Minutos desde medianoche locales (incluye segundos como fracción). */
  minutesOfDay: number;
}

function zonedParts(now: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? "0";

  // hour12:false puede devolver "24" para la medianoche en algunos entornos.
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  const second = Number(get("second"));

  return {
    dateYmd: `${get("year")}-${get("month")}-${get("day")}`,
    minutesOfDay: hour * 60 + minute + second / 60,
  };
}

function parseCutoffMinutes(cutoffTime: string): number {
  const match = cutoffTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    throw new Error(`CUTOFF_TIME inválida: ${cutoffTime}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Evalúa si es permitido crear un pedido anticipado en el instante `now`.
 * Límite exacto: a los 10:00 exactos de anticipación se permite; a 9:59 se rechaza.
 */
export function checkCutoff(now: Date, config: CutoffConfig): CutoffCheck {
  const cutoffMinutes = parseCutoffMinutes(config.cutoffTime);
  const { minutesOfDay } = zonedParts(now, config.timeZone);
  const remaining = cutoffMinutes - minutesOfDay;

  if (remaining >= CUTOFF_WINDOW_MINUTES) {
    return { ok: true, reason: null };
  }
  return { ok: false, reason: CUTOFF_MESSAGE };
}

/** Fecha de servicio (YYYY-MM-DD) en la zona horaria dada; base del folio y del menú. */
export function fechaServicio(now: Date, timeZone: string): string {
  return zonedParts(now, timeZone).dateYmd;
}
