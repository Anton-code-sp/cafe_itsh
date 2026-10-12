import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cancelOrder, getOrder } from "../../../lib/api";
import type { OrderDetail } from "../../../lib/api";

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
    return <p className="text-sm text-stone-500">Cargando pedido…</p>;
  }

  if (error) {
    return (
      <section>
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
        <button
          type="button"
          onClick={() => navigate("/menu")}
          className="mt-3 text-sm text-amber-800 underline"
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
      <h1 className="mb-2 text-xl font-bold text-amber-900">Pedido {order.numero}</h1>
      <p className="mb-4 text-sm text-stone-600">
        Estado:{" "}
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            order.estado === "Pagado"
              ? "bg-green-100 text-green-800"
              : order.estado === "Cancelado"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-900"
          }`}
        >
          {order.estado}
        </span>
      </p>

      <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {order.items.map((item, idx) => (
          <li key={idx} className="flex justify-between p-4 text-sm">
            <span>
              {item.nombre} × {item.cantidad}
            </span>
            <span className="font-semibold">${item.subtotal}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-right text-lg font-bold text-amber-900">
        Total: ${order.total}
      </p>

      {order.pago && (
        <p className="mt-2 text-sm text-stone-500">
          Pago {order.pago.metodo}: ${order.pago.monto} · Ref {order.pago.referencia}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Link
          to="/menu"
          className="rounded-md border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
        >
          Volver al menú
        </Link>
        {cancelable && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="rounded-md border border-red-300 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {cancelling ? "Cancelando…" : "Cancelar pedido"}
          </button>
        )}
      </div>
    </section>
  );
}
