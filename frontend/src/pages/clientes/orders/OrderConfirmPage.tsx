import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cancelOrder, getOrder } from "../../../lib/api";
import type { OrderDetail } from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { StatusBadge } from "../../../components/StatusBadge";

export function OrderConfirmPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    const orderId = Number(id);
    getOrder(orderId)
      .then((data) => {
        setOrder(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar el pedido");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = () => {
    setCancelling(true);
    cancelOrder(Number(id))
      .then((updated) => {
        setOrder(updated);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudo cancelar el pedido");
      })
      .finally(() => {
        setCancelling(false);
      });
  };

  if (loading) {
    return <p className="text-sm text-on-surface-variant">Cargando pedido…</p>;
  }

  if (error) {
    return (
      <section>
        <p
          role="alert"
          className="rounded-md bg-error-container p-3 text-sm text-on-error-container"
        >
          {error}
        </p>
        <button
          type="button"
          onClick={() => navigate("/menu")}
          className="mt-3 text-sm text-primary underline underline-offset-4"
        >
          Volver al menú
        </button>
      </section>
    );
  }

  if (!order) return null;

  const cancelable = order.estado === "Pendiente" || order.estado === "Pagado";

  return (
    <section>
      <h1 className="mb-2 font-display text-headline-md text-on-surface">
        Pedido {order.numero}
      </h1>
      <p className="mb-4 flex items-center gap-2 text-sm text-on-surface-variant">
        Estado:
        <StatusBadge status={order.estado} />
      </p>

      <ul className="divide-y divide-outline-variant rounded-lg border border-outline-variant bg-white shadow-sm">
        {order.items.map((item, idx) => (
          <li key={idx} className="flex justify-between p-4 text-sm">
            <span>
              {item.nombre} × {item.cantidad}
            </span>
            <span className="font-semibold">${item.subtotal}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-right font-display text-lg font-bold text-on-surface">
        Total: ${order.total}
      </p>

      {order.pago && (
        <p className="mt-2 text-sm text-on-surface-variant">
          Pago {order.pago.metodo}: ${order.pago.monto} · Ref {order.pago.referencia}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline">
          <Link to="/menu">Volver al menú</Link>
        </Button>
        {cancelable && (
          <Button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            variant="outline"
            className="border-error/40 text-error hover:bg-error-container hover:text-on-error-container"
          >
            {cancelling ? "Cancelando…" : "Cancelar pedido"}
          </Button>
        )}
      </div>
    </section>
  );
}
