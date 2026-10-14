import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coffee, PackageCheck, ShoppingCart } from "lucide-react";
import {
  listRecentCounterOrders,
  listReadyOrders,
  undoCounterOrder,
  type RecentCounterOrder,
} from "../../lib/api";
import { StatusBadge } from "../../components/StatusBadge";

export function CajaHomePage() {
  const [readyCount, setReadyCount] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecentCounterOrder[]>([]);
  const [undoingId, setUndoingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listReadyOrders()
      .then(({ orders }) => {
        setReadyCount(orders.length);
        setError(null);
      })
      .catch(() => {
        // el contador es secundario: no bloquea el inicio
      });
    listRecentCounterOrders()
      .then((res) => setRecent(res.orders))
      .catch(() => {
        // la lista reciente es secundaria
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUndo = async (id: number) => {
    setUndoingId(id);
    setError(null);
    try {
      await undoCounterOrder(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo deshacer el pedido");
    } finally {
      setUndoingId(null);
    }
  };

  const fechaHoy = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section>
      <header className="mb-4">
        <p className="text-label-md capitalize text-on-surface-variant">{fechaHoy}</p>
        <h1 className="font-display text-headline-md text-on-surface">Inicio de caja</h1>
      </header>

      <div className="mb-6 rounded-lg bg-surface-container p-6 text-center">
        <Coffee className="mx-auto mb-2 h-8 w-8 text-espresso" aria-hidden />
        <p className="font-display text-title-md font-bold text-on-surface">
          ¡Buen día! Tu café, en buenas manos
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-error-container p-3 text-sm text-on-error-container"
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to="/caja/capturar"
          className="flex min-h-24 items-center gap-4 rounded-lg border border-outline-variant bg-white p-4 transition-colors hover:bg-surface-container-low"
        >
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container"
          >
            <ShoppingCart className="h-6 w-6" />
          </span>
          <span>
            <span className="block font-display text-title-md font-bold text-on-surface">
              Capturar pedido
            </span>
            <span className="block text-label-md text-on-surface-variant">
              Nuevo pedido de mostrador
            </span>
          </span>
        </Link>

        <Link
          to="/caja/entregas"
          className="flex min-h-24 items-center gap-4 rounded-lg border border-outline-variant bg-white p-4 transition-colors hover:bg-surface-container-low"
        >
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container"
          >
            <PackageCheck className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-title-md font-bold text-on-surface">
              Entregas
            </span>
            <span className="block text-label-md text-on-surface-variant">
              {readyCount === null
                ? "Cargando…"
                : readyCount === 0
                  ? "Sin pedidos listos"
                  : `${readyCount} pedido${readyCount === 1 ? "" : "s"} listo${readyCount === 1 ? "" : "s"}`}
            </span>
          </span>
          {readyCount !== null && readyCount > 0 && (
            <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-2 text-caption font-bold text-on-primary">
              {readyCount}
            </span>
          )}
        </Link>
      </div>

      <section aria-label="Últimos pedidos de mostrador" className="mt-8">
        <h2 className="mb-2 font-display text-title-md font-bold text-on-surface">
          Últimos pedidos
        </h2>
        {recent.length === 0 ? (
          <p className="rounded-lg border border-dashed border-outline-variant bg-white/60 p-4 text-center text-sm text-on-surface-variant">
            Todavía no hay pedidos de mostrador hoy.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
            {recent.map((order) => (
              <li key={order.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-body-base font-bold text-on-surface">
                    {order.numero}
                  </p>
                  <p className="text-caption text-on-surface-variant">
                    ${order.total} · {order.creadoEn.replace("T", " ").slice(0, 16)}
                  </p>
                </div>
                <StatusBadge status={order.estado} />
                {order.estado === "Pagado" && (
                  <button
                    type="button"
                    disabled={undoingId === order.id}
                    onClick={() => handleUndo(order.id)}
                    className="min-h-11 shrink-0 rounded-md border border-outline-variant bg-white px-4 text-label-md font-semibold text-on-surface hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {undoingId === order.id ? "Deshaciendo…" : "Deshacer"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
