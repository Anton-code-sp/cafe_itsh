import { pool } from "../db/pool.js";
import { badRequest } from "../errors.js";
import { formatCents, toCents } from "../utils/money.js";

/**
 * Reporte admin (US2, research R5): agregados por estado y por tipo en un
 * rango de fechas, calculados con GROUP BY en SQL.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface ReportRow {
  estado: string;
  tipo: string;
  pedidos: number;
  monto: string;
}

export interface SalesReport {
  rango: { desde: string; hasta: string };
  resumen: { pedidos: number; monto: string };
  porEstado: Array<{ estado: string; pedidos: number; monto: string }>;
  porTipo: Array<{ tipo: string; pedidos: number; monto: string }>;
}

function validateRange(desde: string, hasta: string): void {
  if (!DATE_RE.test(desde) || !DATE_RE.test(hasta)) {
    throw badRequest("Rango inválido: usa el formato YYYY-MM-DD (desde y hasta)");
  }
  if (desde > hasta) {
    throw badRequest("Rango inválido: 'desde' debe ser anterior o igual a 'hasta'");
  }
}

export async function getSalesReport(desde: string, hasta: string): Promise<SalesReport> {
  validateRange(desde, hasta);

  const { rows } = await pool.query<ReportRow>(
    `SELECT e.nombre AS estado, p.tipo, COUNT(*)::int AS pedidos,
            COALESCE(SUM(p.total), 0)::text AS monto
       FROM pedido p
       JOIN estado_pedido e ON e.id = p.estado_id
      WHERE p.creado_en >= $1::date
        AND p.creado_en < ($2::date + INTERVAL '1 day')
      GROUP BY e.nombre, p.tipo
      ORDER BY e.nombre, p.tipo`,
    [desde, hasta],
  );

  let totalPedidos = 0;
  let totalCents = 0;

  const estadoMap = new Map<string, { pedidos: number; cents: number }>();
  const tipoMap = new Map<string, { pedidos: number; cents: number }>();

  for (const row of rows) {
    const cents = toCents(row.monto);
    totalPedidos += row.pedidos;
    totalCents += cents;

    const estado = estadoMap.get(row.estado) ?? { pedidos: 0, cents: 0 };
    estado.pedidos += row.pedidos;
    estado.cents += cents;
    estadoMap.set(row.estado, estado);

    const tipo = tipoMap.get(row.tipo) ?? { pedidos: 0, cents: 0 };
    tipo.pedidos += row.pedidos;
    tipo.cents += cents;
    tipoMap.set(row.tipo, tipo);
  }

  return {
    rango: { desde, hasta },
    resumen: { pedidos: totalPedidos, monto: formatCents(totalCents) },
    porEstado: [...estadoMap.entries()].map(([estado, v]) => ({
      estado,
      pedidos: v.pedidos,
      monto: formatCents(v.cents),
    })),
    porTipo: [...tipoMap.entries()].map(([tipo, v]) => ({
      tipo,
      pedidos: v.pedidos,
      monto: formatCents(v.cents),
    })),
  };
}
