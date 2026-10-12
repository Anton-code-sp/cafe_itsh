import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createOrder, quoteOrder } from "../../../lib/api";
import { useCart } from "../../../lib/cart-context";
import { formatCents } from "../../../lib/money";
import type { CreatedOrder } from "../../../lib/api";

export function CartPage() {
  const { items, setQuantity, removeItem, clear, totalCents } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    setError(null);

    quoteOrder(items.map((i) => ({ menuDiaId: i.menuDiaId, cantidad: i.cantidad })))
      .then((quote) => {
        if (!quote.canOrder) {
          setError(quote.reason ?? "No es posible realizar el pedido en este momento");
          setLoading(false);
          return null;
        }
        return createOrder(items.map((i) => ({ menuDiaId: i.menuDiaId, cantidad: i.cantidad })));
      })
      .then((created: CreatedOrder | null) => {
        if (!created) return;
        clear();
        navigate("/checkout", {
          state: {
            orderId: created.order.id,
            numero: created.order.numero,
            total: created.order.total,
            reference: created.payment.reference,
          },
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudo crear el pedido");
        setLoading(false);
      });
  };

  if (items.length === 0) {
    return (
      <section>
        <h1 className="mb-4 text-xl font-bold text-amber-900">Tu pedido</h1>
        <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-stone-500">
          <p className="font-medium">Tu carrito está vacío.</p>
          <Link to="/menu" className="mt-2 inline-block text-sm text-amber-800 underline">
            Volver al menú
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1 className="mb-4 text-xl font-bold text-amber-900">Tu pedido</h1>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
        El pedido debe hacerse con al menos 10 minutos de anticipación. El total lo
        confirma el servidor antes de pagar.
      </p>

      <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {items.map((item) => (
          <li key={item.menuDiaId} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-stone-800">{item.nombre}</p>
              <p className="text-sm text-stone-500">
                ${item.precio} × {item.cantidad}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Quitar una unidad de ${item.nombre}`}
                onClick={() =>
                  setQuantity(
                    { menuDiaId: item.menuDiaId, nombre: item.nombre, precio: item.precio },
                    item.cantidad - 1,
                  )
                }
                className="h-8 w-8 rounded border border-stone-300 text-lg leading-none text-stone-700"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold">{item.cantidad}</span>
              <button
                type="button"
                aria-label={`Agregar una unidad de ${item.nombre}`}
                onClick={() =>
                  setQuantity(
                    { menuDiaId: item.menuDiaId, nombre: item.nombre, precio: item.precio },
                    item.cantidad + 1,
                  )
                }
                className="h-8 w-8 rounded border border-stone-300 text-lg leading-none text-stone-700"
              >
                +
              </button>
              <span className="ml-2 w-20 text-right font-semibold text-amber-900">
                ${formatCents(totalCents)}
              </span>
              <button
                type="button"
                aria-label={`Eliminar ${item.nombre} del carrito`}
                onClick={() => removeItem(item.menuDiaId)}
                className="ml-1 text-sm text-red-600 underline"
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-bold text-amber-900">
          Total: ${formatCents(totalCents)}
        </span>
        <button
          type="button"
          onClick={handlePay}
          disabled={loading}
          className="rounded-md bg-amber-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? "Procesando…" : "Pagar"}
        </button>
      </div>
    </section>
  );
}
