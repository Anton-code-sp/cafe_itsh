import type { KitchenOrder } from "../../lib/api";
import { StatusBadge } from "../StatusBadge";

interface OrderCardProps {
  order: KitchenOrder;
  busy: boolean;
  onStart: () => void;
  onReady: () => void;
}

function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return Number.NaN;
  return h * 60 + m;
}

/** "¡Retrasado!" cuando la hora de recolección comprometida ya pasó. */
function isLate(order: KitchenOrder): boolean {
  if (order.tipo !== "anticipado" || !order.horaRecoleccion) return false;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const recMin = minutesOfDay(order.horaRecoleccion);
  return Number.isFinite(recMin) && nowMin > recMin;
}

export function OrderCard({ order, busy, onStart, onReady }: OrderCardProps) {
  const isPreparing = order.estado === "En preparación";
  const late = isLate(order);
  const horaRegistro = order.creadoEn.slice(11, 16);
  const cliente = order.clienteNombre ?? "Mostrador";

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-2xl font-extrabold text-primary">#{order.id}</p>
          <p className="font-mono text-xl font-bold text-on-surface">{order.numero}</p>
        </div>
        <StatusBadge status={order.estado} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span
          className={
            order.tipo === "mostrador"
              ? "rounded-full bg-primary-container px-2.5 py-1 text-caption font-bold text-on-primary-container"
              : "rounded-full bg-tertiary-container px-2.5 py-1 text-caption font-bold text-on-tertiary-container"
          }
        >
          {order.tipo === "mostrador" ? "Mostrador" : "Anticipado"}
        </span>
        <span className="font-medium text-on-surface">{cliente}</span>
        <span className="text-on-surface-variant">· {horaRegistro}</span>
        {order.horaRecoleccion && (
          <span className="font-bold text-on-surface">· recoge {order.horaRecoleccion}</span>
        )}
      </div>

      {late ? (
        <p className="text-sm font-bold text-error">¡Retrasado!</p>
      ) : (
        <p className="text-caption text-on-surface-variant">
          Espera: <strong>{order.minutosEspera} min</strong>
        </p>
      )}

      <ul className="divide-y divide-outline-variant rounded-md border border-outline-variant bg-surface">
        {order.items.map((item, idx) => (
          <li
            key={`${item.nombre}-${idx}`}
            className="flex items-center justify-between px-3 py-2"
          >
            <span className="text-base font-medium text-on-surface">{item.nombre}</span>
            <span className="font-display text-xl font-extrabold text-on-surface">
              ×{item.cantidad}
            </span>
          </li>
        ))}
      </ul>

      {order.estado === "Listo" ? (
        <p className="py-2 text-center text-sm text-on-surface-variant">
          Listo — en espera de caja
        </p>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={isPreparing ? onReady : onStart}
          className="min-h-12 w-full rounded-md bg-primary px-4 text-base font-semibold text-on-primary hover:bg-primary/90 disabled:opacity-50"
        >
          {busy
            ? "Procesando…"
            : isPreparing
              ? "Marcar listo"
              : "Iniciar preparación"}
        </button>
      )}
    </article>
  );
}
