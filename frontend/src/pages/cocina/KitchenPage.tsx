import { useCallback, useEffect, useState } from "react";
import {
  getKitchenQueue,
  readyOrder,
  startOrder,
  type KitchenOrder,
} from "../../lib/api";
import { OrderCard } from "../../components/kitchen/OrderCard";

const POLL_MS = 10_000;

export function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await getKitchenQueue();
      setOrders(res.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la cola");
    }
  }, []);

  useEffect(() => {
    getKitchenQueue()
      .then((res) => setOrders(res.orders))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar la cola"),
      );
    const timer = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
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
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-headline-md text-on-surface">Cola de cocina</h1>
        <span className="text-sm text-on-surface-variant">
          {orders.length} pedido{orders.length === 1 ? "" : "s"} · se actualiza cada 10 s
        </span>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-error-container p-3 text-sm text-on-error-container">
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-outline-variant bg-white/60 p-10 text-center text-on-surface-variant">
          <p className="font-medium">Sin pedidos en cocina.</p>
          <p className="mt-1 text-sm">Los pedidos pagados aparecen aquí automáticamente.</p>
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
