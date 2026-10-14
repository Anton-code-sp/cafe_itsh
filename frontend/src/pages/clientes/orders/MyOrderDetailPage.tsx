import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMyOrder, getOrderNotifications } from "../../../lib/api";
import type { MyOrderDetail, OrderNotification } from "../../../lib/api";
import { StatusBadge } from "../../../components/StatusBadge";
import { Button } from "../../../components/ui/button";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MyOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<MyOrderDetail | null>(null);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const orderId = Number(id);
    getMyOrder(orderId)
      .then((data) => {
        setDetail(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar el pedido");
      })
      .finally(() => {
        setLoading(false);
      });
    getOrderNotifications(orderId)
      .then((data) => {
        setNotifications(data.notifications);
      })
      .catch(() => {
        setNotifications([]);
      });
  }, [id]);

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
        <Button asChild variant="outline" className="mt-3">
          <Link to="/mis-pedidos">Volver a mis pedidos</Link>
        </Button>
      </section>
    );
  }

  if (!detail) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-headline-md text-on-surface">
          Pedido {detail.order.numero}
        </h1>
        <StatusBadge status={detail.order.estado} />
      </div>

      {detail.order.estado === "Listo" && (
        <p
          role="status"
          className="mb-4 rounded-md border-2 border-status-ready bg-status-ready/10 p-3 text-sm font-bold text-status-ready"
        >
          ¡Listo para recoger! Acude a la cafetería con tu número de pedido.
        </p>
      )}

      <p className="mb-4 text-sm text-on-surface-variant">
        {detail.order.tipo === "anticipado" ? "Anticipado" : "Mostrador"} · Total:{" "}
        <span className="font-semibold text-on-surface">${detail.order.total}</span>
      </p>

      <h2 className="mb-2 font-display text-title text-on-surface">Detalle</h2>
      <ul className="mb-6 divide-y divide-outline-variant rounded-lg border border-outline-variant bg-white shadow-sm">
        {detail.items.map((item, idx) => (
          <li key={idx} className="flex justify-between p-4 text-sm">
            <span>
              {item.nombre} × {item.cantidad}
            </span>
            <span className="font-semibold">${item.subtotal}</span>
          </li>
        ))}
      </ul>

      <h2 className="mb-2 font-display text-title text-on-surface">Historial</h2>
      <ol className="mb-6 space-y-2 rounded-lg border border-outline-variant bg-white p-4 shadow-sm">
        {detail.historial.length === 0 && (
          <li className="text-sm text-on-surface-variant">Sin movimientos registrados.</li>
        )}
        {detail.historial.map((entry, idx) => (
          <li key={idx} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <StatusBadge status={entry.estado} />
            </span>
            <span className="text-xs text-on-surface-variant">{formatDateTime(entry.en)}</span>
          </li>
        ))}
      </ol>

      <h2 className="mb-2 font-display text-title text-on-surface">Avisos</h2>
      <ul className="mb-6 divide-y divide-outline-variant rounded-lg border border-outline-variant bg-white shadow-sm">
        {notifications.length === 0 && (
          <li className="p-4 text-sm text-on-surface-variant">
            Todavía no hay avisos para este pedido.
          </li>
        )}
        {notifications.map((n, idx) => (
          <li key={idx} className="flex items-center justify-between gap-3 p-4 text-sm">
            <div className="min-w-0">
              <p className="truncate text-on-surface">{n.asunto ?? "Aviso"}</p>
              <p className="text-xs text-on-surface-variant">
                {n.canal} · {formatDateTime(n.creadoEn)}
              </p>
            </div>
            <span
              className={
                n.estadoEnvio === "enviada"
                  ? "shrink-0 rounded-full bg-status-ready px-2.5 py-1 text-caption font-semibold text-white"
                  : n.estadoEnvio === "fallida"
                    ? "shrink-0 rounded-full bg-error px-2.5 py-1 text-caption font-semibold text-white"
                    : "shrink-0 rounded-full bg-status-pending px-2.5 py-1 text-caption font-semibold text-white"
              }
            >
              {n.estadoEnvio}
            </span>
          </li>
        ))}
      </ul>

      <Button asChild variant="outline">
        <Link to="/mis-pedidos">Volver a mis pedidos</Link>
      </Button>
    </section>
  );
}
