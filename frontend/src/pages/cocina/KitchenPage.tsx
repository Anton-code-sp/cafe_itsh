import { useCallback, useEffect, useRef, useState } from "react";
import {
  getKitchenQueue,
  readyOrder,
  startOrder,
  type KitchenOrder,
} from "../../lib/api";
import { OrderCard } from "../../components/kitchen/OrderCard";

const POLL_MS = 4_000;

export function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [failures, setFailures] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const failRef = useRef(0);

  const refresh = useCallback(async (clearError = true) => {
    try {
      const res = await getKitchenQueue();
      setOrders(res.orders);
      if (clearError) setError(null);
      setLastUpdated(Date.now());
      failRef.current = 0;
      setFailures(0);
    } catch (err) {
      failRef.current += 1;
      setFailures(failRef.current);
      setError(
        (prev) =>
          prev ??
          (err instanceof Error ? err.message : "No se pudo actualizar la cola"),
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const poll = setInterval(() => {
      void refresh();
    }, POLL_MS);
    const ticker = setInterval(() => {
      setNow(Date.now());
    }, 1_000);
    return () => {
      clearInterval(poll);
      clearInterval(ticker);
    };
  }, [refresh]);

  const handleAction = async (order: KitchenOrder, action: "start" | "ready") => {
    setBusyId(order.id);
    setError(null);
    try {
      if (action === "start") {
        await startOrder(order.id);
      } else {
        await readyOrder(order.id);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el pedido");
      await refresh(false);
    } finally {
      setBusyId(null);
    }
  };

  const offline = failures >= 2;
  const ageSeconds =
    lastUpdated !== null ? Math.max(0, Math.floor((now - lastUpdated) / 1000)) : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-headline-md text-on-surface">Cola de cocina</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-on-surface-variant">
            {orders.length} pedido{orders.length === 1 ? "" : "s"}
          </span>
          {offline ? (
            <span role="status" className="font-semibold text-error">
              Sin conexión — reintentando…
            </span>
          ) : (
            <span className="text-on-surface-variant" aria-live="polite">
              {ageSeconds !== null ? `act. hace ${ageSeconds} s` : "conectando…"}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-error-container p-3 text-sm text-on-error-container"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setError(null);
              void refresh();
            }}
            className="min-h-11 rounded-md border border-on-error-container/40 px-3 font-semibold hover:bg-on-error-container/10"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loaded ? (
        <p className="text-caption text-on-surface-variant">Cargando pedidos…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-outline-variant bg-white/60 p-10 text-center text-on-surface-variant">
          <p className="font-medium">¡Todo está al día!</p>
          <p className="mt-1 text-sm">No hay pedidos en cocina. Los pedidos pagados aparecen aquí solos.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={busyId === order.id}
              onStart={() => handleAction(order, "start")}
              onReady={() => handleAction(order, "ready")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
