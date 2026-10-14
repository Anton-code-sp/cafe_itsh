import { formatCents, sumCents, toCents } from "../../lib/money";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export interface CounterCartLine {
  menuDiaId: number;
  nombre: string;
  precio: string;
  cantidad: number;
}

interface CounterCartProps {
  items: CounterCartLine[];
  montoRecibido: string;
  onRecibidoChange: (value: string) => void;
  onQtyChange: (menuDiaId: number, cantidad: number) => void;
}

function safeCents(value: string): number | null {
  if (!value.trim()) return null;
  try {
    return toCents(value);
  } catch {
    return null;
  }
}

export function CounterCart({
  items,
  montoRecibido,
  onRecibidoChange,
  onQtyChange,
}: CounterCartProps) {
  const totalCents = sumCents(items.map((i) => toCents(i.precio) * i.cantidad));
  const recibidoCents = safeCents(montoRecibido);
  const cambioCents = recibidoCents === null ? null : recibidoCents - totalCents;

  return (
    <section
      aria-label="Pedido en curso"
      className="rounded-lg border border-outline-variant bg-white shadow-sm"
    >
      <header className="border-b border-outline-variant px-4 py-3">
        <h2 className="font-display text-lg font-bold text-on-surface">Pedido de mostrador</h2>
      </header>

      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-on-surface-variant">
          Carrito vacío. Agrega platillos del menú de hoy.
        </p>
      ) : (
        <ul className="divide-y divide-outline-variant">
          {items.map((item) => (
            <li key={item.menuDiaId} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-on-surface">{item.nombre}</p>
                <p className="text-xs text-on-surface-variant">${item.precio} c/u</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Quitar una unidad de ${item.nombre}`}
                  onClick={() => onQtyChange(item.menuDiaId, item.cantidad - 1)}
                  className="h-9 w-9 rounded-md border border-outline-variant bg-white text-lg leading-none text-on-surface hover:border-primary hover:text-primary"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.cantidad}</span>
                <button
                  type="button"
                  aria-label={`Agregar una unidad de ${item.nombre}`}
                  onClick={() => onQtyChange(item.menuDiaId, item.cantidad + 1)}
                  className="h-9 w-9 rounded-md border border-outline-variant bg-white text-lg leading-none text-on-surface hover:border-primary hover:text-primary"
                >
                  +
                </button>
                <span className="ml-1 w-20 text-right font-display text-sm font-bold text-on-surface">
                  ${formatCents(toCents(item.precio) * item.cantidad)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 border-t border-outline-variant px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Total</span>
          <span className="font-display text-xl font-bold text-on-surface">
            ${formatCents(totalCents)}
          </span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="monto-recibido">Efectivo recibido</Label>
          <Input
            id="monto-recibido"
            inputMode="decimal"
            placeholder="0.00"
            value={montoRecibido}
            onChange={(e) => onRecibidoChange(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">Cambio</span>
          {recibidoCents === null ? (
            <span className="text-on-surface-variant">—</span>
          ) : cambioCents !== null && cambioCents >= 0 ? (
            <span className="font-semibold text-on-surface">${formatCents(cambioCents)}</span>
          ) : (
            <span className="font-semibold text-error">
              Faltan ${formatCents(Math.abs(cambioCents ?? 0))}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
