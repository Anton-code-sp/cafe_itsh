import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMenu } from "../../../lib/api";
import type { MenuItem } from "../../../lib/api";
import { DishCard } from "../../../components/dishes/DishCard";
import { useCart } from "../../../lib/cart-context";

export function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [fecha, setFecha] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { items: cartItems, setQuantity, count, totalCents } = useCart();

  const load = useCallback(() => {
    getMenu()
      .then((data) => {
        setItems(data.items);
        setFecha(data.fecha);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar el menú");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();

    const timer = window.setInterval(load, 30_000);
    const onFocus = () => {
      void load();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const quantityOf = (menuDiaId: number): number =>
    cartItems.find((i) => i.menuDiaId === menuDiaId)?.cantidad ?? 0;

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="font-display text-headline-md text-on-surface">Menú del día</h1>
        {fecha && <span className="text-sm text-on-surface-variant">{fecha}</span>}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-error-container p-3 text-sm text-on-error-container"
        >
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-on-surface-variant">Cargando menú…</p>}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-outline-variant bg-white/60 p-8 text-center text-on-surface-variant">
          <p className="font-medium">No hay menú publicado para hoy.</p>
          <p className="mt-1 text-sm">
            Vuelve a consultar en unos minutos; el menú se actualiza automáticamente.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <DishCard item={item} />
              {item.disponible && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Quitar una unidad de ${item.nombre}`}
                    onClick={() =>
                      setQuantity(
                        { menuDiaId: item.id, nombre: item.nombre, precio: item.precio },
                        quantityOf(item.id) - 1,
                      )
                    }
                    disabled={quantityOf(item.id) === 0}
                    className="h-9 w-9 rounded-md border border-outline-variant bg-white text-lg leading-none text-on-surface hover:border-primary hover:text-primary disabled:opacity-40"
                  >
                    −
                  </button>
                  <span
                    aria-label={`Cantidad de ${item.nombre}`}
                    className="w-8 text-center text-sm font-semibold text-on-surface"
                  >
                    {quantityOf(item.id)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Agregar una unidad de ${item.nombre}`}
                    onClick={() =>
                      setQuantity(
                        { menuDiaId: item.id, nombre: item.nombre, precio: item.precio },
                        quantityOf(item.id) + 1,
                      )
                    }
                    className="h-9 w-9 rounded-md border border-outline-variant bg-white text-lg leading-none text-on-surface hover:border-primary hover:text-primary"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {count > 0 && (
        <Link
          to="/cart"
          className="fixed bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg hover:bg-primary/90"
        >
          Ver pedido ({count})
          <span className="rounded-full bg-on-primary-container px-2 py-0.5 text-primary-container">
            ${(totalCents / 100).toFixed(2)}
          </span>
        </Link>
      )}
    </section>
  );
}
