import type { KitchenOrder } from "../../lib/api";
import { StatusBadge } from "../StatusBadge";
import { Button } from "../ui/button";

interface OrderCardProps {
  order: KitchenOrder;
  busy: boolean;
  onStart: () => void;
  onReady: () => void;
}

export function OrderCard({ order, busy, onStart, onReady }: OrderCardProps) {
  const isPreparing = order.estado === "En preparación";

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-on-surface">{order.numero}</p>
          <p className="text-sm text-on-surface-variant">
            Espera: <strong>{order.minutosEspera} min</strong>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={
              order.tipo === "mostrador"
                ? "rounded-full bg-primary-container px-2.5 py-1 text-caption font-bold text-on-primary-container"
                : "rounded-full bg-tertiary-container px-2.5 py-1 text-caption font-bold text-on-tertiary-container"
            }
          >
            {order.tipo === "mostrador" ? "Mostrador" : "Anticipado"}
          </span>
          <StatusBadge status={order.estado} />
        </div>
      </div>

      <ul className="divide-y divide-outline-variant rounded-md border border-outline-variant bg-surface">
        {order.items.map((item, idx) => (
          <li
            key={`${item.nombre}-${idx}`}
            className="flex items-center justify-between px-3 py-2 text-sm"
          >
            <span className="font-medium text-on-surface">{item.nombre}</span>
            <span className="font-display text-base font-bold text-on-surface">
              ×{item.cantidad}
            </span>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        size="lg"
        className="w-full"
        variant={isPreparing ? "primary" : "secondary"}
        disabled={busy}
        onClick={isPreparing ? onReady : onStart}
      >
        {busy ? "Procesando…" : isPreparing ? "Listo" : "Empezar"}
      </Button>
    </article>
  );
}
