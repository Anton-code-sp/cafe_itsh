import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { confirmPayment } from "../../../lib/api";
import { Button } from "../../../components/ui/button";

interface CheckoutState {
  orderId: number;
  numero: string;
  total: string;
  reference: string;
}

export function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as CheckoutState | null;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!state) {
    return <Navigate to="/menu" replace />;
  }

  const handleConfirm = () => {
    setLoading(true);
    setError(null);

    confirmPayment(state.orderId)
      .then(() => {
        navigate(`/orders/${state.orderId}`, { replace: true });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudo confirmar el pago");
        setLoading(false);
      });
  };

  return (
    <section>
      <h1 className="mb-4 font-display text-headline-md text-on-surface">
        Pago (sandbox)
      </h1>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-error-container p-3 text-sm text-on-error-container"
        >
          {error}
        </p>
      )}

      <div className="rounded-lg border border-outline-variant bg-white p-6 shadow-sm">
        <p className="text-sm text-on-surface-variant">
          Pedido <span className="font-semibold text-on-surface">{state.numero}</span>
        </p>
        <p className="mt-1 font-display text-lg font-bold text-on-surface">
          Total: ${state.total}
        </p>
        <p className="mt-1 text-xs text-outline">Referencia: {state.reference}</p>

        <p className="mt-4 rounded-md bg-surface-container p-3 text-sm text-on-surface-variant">
          Entorno de prueba: no se solicitan datos reales de tarjeta. Al confirmar,
          el pedido pasa a estado <span className="font-semibold">Pagado</span>.
        </p>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            size="lg"
          >
            {loading ? "Confirmando…" : "Confirmar pago"}
          </Button>
          <Button
            type="button"
            onClick={() => navigate(`/orders/${state.orderId}`)}
            variant="outline"
          >
            Dejar pendiente
          </Button>
        </div>
      </div>
    </section>
  );
}
