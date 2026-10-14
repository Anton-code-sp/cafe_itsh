import { useEffect, useMemo, useState } from "react";
import {
  createCounterOrder,
  getMenu,
  listRecentCounterOrders,
  undoCounterOrder,
  ApiError,
  type MenuItem,
  type RecentCounterOrder,
} from "../../lib/api";
import { CounterCart, type CounterCartLine } from "../../components/counter/CounterCart";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { formatCents, sumCents, toCents } from "../../lib/money";

interface ChargeSuccess {
  numero: string;
  total: string;
  cambioCents: number;
}

export function CajaPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<CounterCartLine[]>([]);
  const [clienteNombre, setClienteNombre] = useState("");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [recent, setRecent] = useState<RecentCounterOrder[]>([]);
  const [success, setSuccess] = useState<ChargeSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [undoingId, setUndoingId] = useState<number | null>(null);

  const loadRecent = async () => {
    try {
      const res = await listRecentCounterOrders();
      setRecent(res.orders);
    } catch {
      // la lista reciente es secundaria: no bloquea la caja
    }
  };

  useEffect(() => {
    getMenu()
      .then((res) => setMenu(res.items))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar el menú de hoy"),
      );
    listRecentCounterOrders()
      .then((res) => setRecent(res.orders))
      .catch(() => {
        // la lista reciente es secundaria: no bloquea la caja
      });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return menu;
    return menu.filter((m) => m.nombre.toLowerCase().includes(q));
  }, [menu, query]);

  const totalCents = sumCents(lines.map((l) => toCents(l.precio) * l.cantidad));

  const handleQtyChange = (menuDiaId: number, cantidad: number) => {
    setLines((prev) =>
      cantidad <= 0
        ? prev.filter((l) => l.menuDiaId !== menuDiaId)
        : prev.map((l) => (l.menuDiaId === menuDiaId ? { ...l, cantidad } : l)),
    );
  };

  const handleAdd = (item: MenuItem) => {
    setSuccess(null);
    setLines((prev) => {
      const existing = prev.find((l) => l.menuDiaId === item.id);
      if (existing) {
        return prev.map((l) =>
          l.menuDiaId === item.id ? { ...l, cantidad: l.cantidad + 1 } : l,
        );
      }
      return [...prev, { menuDiaId: item.id, nombre: item.nombre, precio: item.precio, cantidad: 1 }];
    });
  };

  const handleCharge = async () => {
    setSuccess(null);
    setError(null);

    if (lines.length === 0) {
      setError("Agrega al menos un platillo al pedido");
      return;
    }

    let recibidoCents: number;
    try {
      recibidoCents = toCents(montoRecibido);
    } catch {
      setError("Ingresa el monto recibido");
      return;
    }
    if (recibidoCents < totalCents) {
      setError("El monto recibido es menor que el total del pedido");
      return;
    }

    setLoading(true);
    try {
      const created = await createCounterOrder({
        clienteNombre: clienteNombre.trim() || undefined,
        items: lines.map((l) => ({ menuDiaId: l.menuDiaId, cantidad: l.cantidad })),
        montoRecibido,
      });
      setSuccess({
        numero: created.order.numero,
        total: created.order.total,
        cambioCents: recibidoCents - toCents(created.order.total),
      });
      setLines([]);
      setMontoRecibido("");
      setClienteNombre("");
      await loadRecent();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "No se pudo crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (id: number) => {
    setUndoingId(id);
    setError(null);
    try {
      await undoCounterOrder(id);
      await loadRecent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo deshacer el pedido");
    } finally {
      setUndoingId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h1 className="font-display text-headline-md text-on-surface">Mostrador</h1>

        {error && (
          <p role="alert" className="rounded-md bg-error-container p-3 text-sm text-on-error-container">
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="rounded-md bg-tertiary-container p-3 text-sm text-on-tertiary-container"
          >
            Pedido <strong>{success.numero}</strong> cobrado (${success.total}). Cambio:{" "}
            <strong>${formatCents(success.cambioCents)}</strong>
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="buscar-platillo">Buscar en el menú de hoy</Label>
          <Input
            id="buscar-platillo"
            placeholder="Nombre del platillo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <ul className="divide-y divide-outline-variant rounded-lg border border-outline-variant bg-white shadow-sm">
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-on-surface-variant">
              Sin resultados en el menú de hoy.
            </li>
          )}
          {filtered.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-on-surface">{item.nombre}</p>
                <p className="text-sm text-on-surface-variant">
                  ${item.precio}
                  {item.especial && (
                    <span className="ml-2 rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-on-primary-container">
                      Especial
                    </span>
                  )}
                  {!item.disponible && (
                    <span className="ml-2 rounded-full bg-error-container px-2 py-0.5 text-xs font-semibold text-on-error-container">
                      No disponible
                    </span>
                  )}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={!item.disponible}
                onClick={() => handleAdd(item)}
              >
                Agregar
              </Button>
            </li>
          ))}
        </ul>

        <section aria-label="Últimos pedidos de mostrador">
          <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
            Últimos pedidos
          </h2>
          {recent.length === 0 ? (
            <p className="rounded-lg border border-dashed border-outline-variant bg-white/60 p-4 text-center text-sm text-on-surface-variant">
              Todavía no hay pedidos de mostrador hoy.
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant rounded-lg border border-outline-variant bg-white shadow-sm">
              {recent.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-on-surface">{order.numero}</p>
                    <p className="text-xs text-on-surface-variant">
                      ${order.total} · {order.creadoEn.replace("T", " ").slice(0, 16)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.estado} />
                    {order.estado === "Pagado" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={undoingId === order.id}
                        onClick={() => handleUndo(order.id)}
                      >
                        {undoingId === order.id ? "Deshaciendo…" : "Deshacer"}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cliente-nombre">Cliente (opcional)</Label>
          <Input
            id="cliente-nombre"
            placeholder="Nombre del cliente"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
          />
        </div>

        <CounterCart
          items={lines}
          montoRecibido={montoRecibido}
          onRecibidoChange={setMontoRecibido}
          onQtyChange={handleQtyChange}
        />

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={loading || lines.length === 0}
          onClick={handleCharge}
        >
          {loading ? "Procesando…" : "Cobrar y crear pedido"}
        </Button>
      </div>
    </div>
  );
}
