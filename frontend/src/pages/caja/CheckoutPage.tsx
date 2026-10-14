import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { createCounterOrder, ApiError } from "../../lib/api";
import { useCajaCart } from "../../lib/caja-cart-context";
import { formatCents, toCents } from "../../lib/money";
import { CounterCart } from "../../components/counter/CounterCart";

interface ChargeSuccess {
  numero: string;
  total: string;
  cambioCents: number;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const {
    lines,
    montoRecibido,
    totalCents,
    setQuantity,
    setMontoRecibido,
    clear,
  } = useCajaCart();
  const [success, setSuccess] = useState<ChargeSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        items: lines.map((l) => ({ menuDiaId: l.menuDiaId, cantidad: l.cantidad })),
        montoRecibido,
      });
      setSuccess({
        numero: created.order.numero,
        total: created.order.total,
        cambioCents: recibidoCents - toCents(created.order.total),
      });
      clear();
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error ? err.message : "No se pudo crear el pedido",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => {
    clear();
    setSuccess(null);
    setError(null);
    navigate("/caja/capturar");
  };

  if (success) {
    return (
      <section>
        <header className="mb-4 flex items-center gap-3">
          <h1 className="font-display text-headline-md text-on-surface">Cobro</h1>
        </header>
        <div
          role="status"
          className="rounded-lg border border-outline-variant bg-white p-6 text-center shadow-sm"
        >
          <CheckCircle2
            className="mx-auto mb-3 h-12 w-12 text-status-paid"
            aria-hidden
          />
          <p className="font-mono text-[22px] font-bold text-on-surface">{success.numero}</p>
          <p className="mt-1 text-body-base text-on-surface-variant">
            Cobro confirmado: <strong>${success.total}</strong> · Cambio:{" "}
            <strong>${formatCents(success.cambioCents)}</strong>
          </p>
          <span className="mt-3 inline-block rounded-full bg-status-paid px-3 py-1 text-label-md font-semibold text-white">
            Pagado
          </span>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleNewOrder}
              className="min-h-12 rounded-md bg-primary px-6 font-display text-title-md font-bold text-on-primary hover:bg-primary/90"
            >
              Nuevo pedido
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          aria-label="Regresar al catálogo"
          onClick={() => navigate("/caja/capturar")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-outline-variant bg-white text-on-surface hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <h1 className="font-display text-headline-md text-on-surface">Cobro</h1>
      </header>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-error-container p-4 text-sm text-on-error-container">
          <p className="font-semibold">El cobro no se completó.</p>
          <p>{error}</p>
          <button
            type="button"
            onClick={handleCharge}
            className="mt-3 min-h-11 rounded-md bg-error px-4 font-semibold text-on-error"
          >
            Reintentar cobro
          </button>
        </div>
      )}

      {lines.length === 0 && !success ? (
        <div className="rounded-lg border border-dashed border-outline-variant bg-white/60 p-6 text-center">
          <p className="text-body-base text-on-surface-variant">
            No hay platillos en el pedido.
          </p>
          <Link
            to="/caja/capturar"
            className="mt-4 inline-flex min-h-12 items-center rounded-md bg-primary px-6 font-display text-title-md font-bold text-on-primary hover:bg-primary/90"
          >
            Capturar pedido
          </Link>
        </div>
      ) : (
        <>
          <CounterCart
            items={lines}
            montoRecibido={montoRecibido}
            onRecibidoChange={setMontoRecibido}
            onQtyChange={setQuantity}
          />

          <div className="mt-4 flex items-center justify-between rounded-lg border border-outline-variant bg-white px-4 py-4">
            <span className="text-body-base text-on-surface-variant">Total</span>
            <span className="font-display text-stat-lg font-extrabold text-primary">
              ${formatCents(totalCents)}
            </span>
          </div>

          <p className="mt-3 text-label-md text-on-surface-variant">
            El pedido se registra y cobra en un solo paso.
          </p>

          <button
            type="button"
            onClick={handleCharge}
            disabled={loading}
            className="mt-4 min-h-12 w-full rounded-md bg-primary font-display text-title-md font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Procesando…" : "Registrar y cobrar"}
          </button>
        </>
      )}
    </section>
  );
}
