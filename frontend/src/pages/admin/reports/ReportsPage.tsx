import { useCallback, useEffect, useState } from "react";
import { getSalesReport } from "../../../lib/api";
import type { SalesReport } from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";

function ymd(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const hoy = new Date();
const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

export function ReportsPage() {
  const [desde, setDesde] = useState(ymd(primerDiaMes));
  const [hasta, setHasta] = useState(ymd(hoy));
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getSalesReport(desde, hasta)
      .then((data) => {
        setReport(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar el reporte");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [desde, hasta]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = () => {
    setLoading(true);
    load();
  };

  return (
    <section>
      <h1 className="mb-4 font-display text-headline-md text-on-surface">
        Reporte de ventas
      </h1>

      <form
        className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-outline-variant bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="reporte-desde">Desde</Label>
          <Input
            id="reporte-desde"
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reporte-hasta">Hasta</Label>
          <Input
            id="reporte-hasta"
            type="date"
            value={hasta}
            min={desde}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Generando…" : "Generar"}
        </Button>
      </form>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-error-container p-3 text-sm text-on-error-container"
        >
          {error}
        </p>
      )}

      {!error && !report && (
        <p className="text-sm text-on-surface-variant">Cargando reporte…</p>
      )}

      {report && (
        <>
          <p className="mb-4 text-sm text-on-surface-variant">
            Rango: {report.rango.desde} al {report.rango.hasta}
          </p>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-outline-variant bg-white p-4">
              <p className="text-sm text-on-surface-variant">Pedidos</p>
              <p className="font-display text-headline-md text-on-surface">
                {report.resumen.pedidos}
              </p>
            </div>
            <div className="rounded-lg border border-outline-variant bg-white p-4">
              <p className="text-sm text-on-surface-variant">Monto total</p>
              <p className="font-display text-headline-md text-on-surface">
                ${report.resumen.monto}
              </p>
            </div>
          </div>

          <div className="mb-6 overflow-hidden rounded-lg border border-outline-variant bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Pedidos</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {report.porEstado.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-on-surface-variant">
                      Sin ventas en este rango.
                    </td>
                  </tr>
                )}
                {report.porEstado.map((row) => (
                  <tr key={row.estado} className="border-t border-surface-container">
                    <td className="px-4 py-3 font-medium">{row.estado}</td>
                    <td className="px-4 py-3 text-right">{row.pedidos}</td>
                    <td className="px-4 py-3 text-right">${row.monto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-lg border border-outline-variant bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Pedidos</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {report.porTipo.map((row) => (
                  <tr key={row.tipo} className="border-t border-surface-container">
                    <td className="px-4 py-3 font-medium capitalize">{row.tipo}</td>
                    <td className="px-4 py-3 text-right">{row.pedidos}</td>
                    <td className="px-4 py-3 text-right">${row.monto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
