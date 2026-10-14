import { cn } from "../lib/utils";

export type OrderStatus =
  | "Pendiente"
  | "Pagado"
  | "En preparación"
  | "Listo"
  | "Entregado"
  | "Cancelado";

const STATUS_CLASSES: Record<OrderStatus, string> = {
  Pendiente: "bg-status-pending",
  Pagado: "bg-status-paid",
  "En preparación": "bg-status-preparing",
  Listo: "bg-status-ready",
  Entregado: "bg-status-delivered",
  Cancelado: "bg-status-cancelled",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const known = STATUS_CLASSES[status as OrderStatus];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-caption font-semibold text-white",
        known ?? "bg-outline",
        className,
      )}
    >
      {status}
    </span>
  );
}
