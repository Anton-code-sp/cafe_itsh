import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../../../lib/api";
import type { MyOrderSummary } from "../../../lib/api";
import { StatusBadge } from "../../../components/StatusBadge";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MyOrdersPage() {
  const [orders, setOrders] = useState<MyOrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getMyOrders()
      .then((data) => {
        setOrders(data.orders);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudieron cargar tus pedidos");
      });
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 15_000);
    const onFocus = () => {
      void refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return (
    <section>
      <h1 className="mb-4 font-display text-headline-md text-on-surface">Mis pedidos</h1>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-error-container p-3 text-sm text-on-error-container"
        >
          {error}
        </p>
      )}

      {orders === null && !error && (
        <p className="text-sm text-on-surface-variant">Cargando pedidos…</p>
      )}

      {orders !== null && orders.length === 0 && (
        <div className="rounded-lg border border-dashed border-outline-variant bg-white/60 p-8 text-center text-sm text-on-surface-variant">
          Aún no tienes pedidos.{" "}
          <Link to="/menu" className="text-primary underline underline-offset-4">
            Ver menú
          </Link>
        </div>
      )}

      {orders !== null && orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/mis-pedidos/${order.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant bg-white p-4 shadow-sm transition hover:border-primary/40 hover:shadow"
              >
                <div className="min-w-0">
                  <p className="truncate font-display font-bold text-on-surface">
                    {order.numero}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {order.tipo === "anticipado" ? "Anticipado" : "Mostrador"} ·{" "}
                    {formatDate(order.creadoEn)}
                    {order.fechaRecoleccion && (
                      <> · Recolección: {formatDate(order.fechaRecoleccion)}</>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge status={order.estado} />
                  <span className="text-sm font-semibold text-on-surface">
                    ${order.total}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
