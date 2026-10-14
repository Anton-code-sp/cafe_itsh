import { useCallback, useEffect, useState } from "react";
import { PackageCheck } from "lucide-react";
import { cancelReadyOrder, deliverOrder, listReadyOrders, type ReadyPickupOrder } from "../../lib/api";
import { StatusBadge } from "../../components/StatusBadge";

export function DeliveriesPage() {
  const [orders, setOrders] = useState<ReadyPickupOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    listReadyOrders()
      .then(({ orders }) => {
        setOrders(orders);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los pedidos listos");
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeliver = async (id: number, numero: string) => {
    setBusyId(id);
    setNotice(null);
    setError(null);
    try {
      await deliverOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setNotice(`Pedido entregado: ${numero}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entregar el pedido");
      load();
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id: number, numero: string) => {
    setBusyId(id);
    setNotice(null);
    setError(null);
    try {
      await cancelReadyOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setNotice(`Pedido cancelado: ${numero}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar el pedido");
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      <header className="mb-4 flex items-center gap-3">
        <h1 className="font-display text-headline-md text-on-surface">Pedidos listos</h1>
        {orders.length > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-caption font-bold text-on-primary">
            {orders.length}
          </span>
        )}
      </header>

      {notice && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-primary-container p-3 text-sm font-semibold text-on-primary-container"
        >
          {notice}
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-outline-variant bg-error-container p-4 text-sm text-on-error-container">
          <p>{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-2 min-h-11 rounded-md bg-error px-4 font-semibold text-on-error"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loaded && !error && (
        <p className="rounded-lg border border-outline-variant bg-white p-4 text-sm text-on-surface-variant">
          Cargando pedidos…
        </p>
      )}

      {loaded && !error && orders.length === 0 && (
        <div className="rounded-lg border border-dashed border-outline-variant bg-white/60 p-8 text-center">
          <PackageCheck className="mx-auto mb-3 h-10 w-10 text-on-surface-variant" aria-hidden />
          <p className="text-body-base text-on-surface-variant">
            ¡Todo está al día! No hay pedidos listos por entregar.
          </p>
        </div>
      )}

      {orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-lg border border-outline-variant bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="font-mono text-[20px] font-bold text-on-surface">
                  {order.numero}
                </span>
                <StatusBadge status="Listo" />
                <span className="ml-auto text-label-md text-on-surface-variant">
                  {order.creadoEn.replace("T", " ").slice(0, 16)}
                </span>
              </div>
              <p className="mb-2 text-body-base text-on-surface">
                Cliente:{" "}
                <strong>{order.clienteNombre ?? "Sin nombre"}</strong>
              </p>
              <ul className="mb-3 flex flex-wrap gap-2">
                {order.items.map((item, idx) => (
                  <li
                    key={`${order.id}-${idx}`}
                    className="rounded-full bg-surface-container px-3 py-1 text-label-md font-semibold text-on-surface"
                  >
                    {item.cantidad}× {item.nombre}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === order.id}
                  onClick={() => handleDeliver(order.id, order.numero)}
                  className="min-h-11 rounded-md bg-primary px-5 font-semibold text-on-primary hover:bg-primary/90 disabled:opacity-50"
                >
                  {busyId === order.id ? "Procesando…" : "Entregar"}
                </button>
                <button
                  type="button"
                  disabled={busyId === order.id}
                  onClick={() => handleCancel(order.id, order.numero)}
                  className="min-h-11 rounded-md border border-outline-variant bg-white px-5 font-semibold text-on-surface hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
