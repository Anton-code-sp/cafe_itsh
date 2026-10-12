import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { confirmPayment } from "../../../lib/api";

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
      <h1 className="mb-4 text-xl font-bold text-amber-900">Pago (sandbox)</h1>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <p className="text-sm text-stone-600">
          Pedido <span className="font-semibold">{state.numero}</span>
        </p>
        <p className="mt-1 text-lg font-bold text-amber-900">Total: ${state.total}</p>
        <p className="mt-1 text-xs text-stone-500">
          Referencia: {state.reference}
        </p>

        <p className="mt-4 rounded-md bg-stone-50 p-3 text-sm text-stone-600">
          Entorno de prueba: no se solicitan datos reales de tarjeta. Al confirmar,
          el pedido pasa a estado <span className="font-semibold">Pagado</span>.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-md bg-amber-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? "Confirmando…" : "Confirmar pago"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/orders/${state.orderId}`)}
            className="rounded-md border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
          >
            Dejar pendiente
          </button>
        </div>
      </div>
    </section>
  );
}
