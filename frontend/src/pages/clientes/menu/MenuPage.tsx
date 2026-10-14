import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Cake, Coffee, Cookie, Sandwich, Utensils } from "lucide-react";
import { getMenu } from "../../../lib/api";
import type { MenuItem } from "../../../lib/api";
import { DishCard } from "../../../components/dishes/DishCard";
import { QuantityStepper } from "../../../components/counter/QuantityStepper";
import { useCart } from "../../../lib/cart-context";
import { formatCents } from "../../../lib/money";

const CATEGORY_ICONS: Record<string, typeof Coffee> = {
  bebidas: Coffee,
  comida: Sandwich,
  snacks: Cookie,
  postres: Cake,
};

function iconForCategoria(categoria: string) {
  return CATEGORY_ICONS[categoria.toLowerCase()] ?? Utensils;
}

export function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [fecha, setFecha] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
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

  const categorias = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.categoria) set.add(item.categoria);
    }
    return [...set];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchQuery =
        q === "" ||
        item.nombre.toLowerCase().includes(q) ||
        (item.descripcion ?? "").toLowerCase().includes(q);
      const matchCategoria = categoria === null || item.categoria === categoria;
      return matchQuery && matchCategoria;
    });
  }, [items, query, categoria]);

  const quantityOf = (menuDiaId: number): number =>
    cartItems.find((i) => i.menuDiaId === menuDiaId)?.cantidad ?? 0;

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="font-display text-headline-md text-on-surface">Menú del día</h1>
        {fecha && <span className="text-sm text-on-surface-variant">{fecha}</span>}
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-lg bg-primary-container/50 px-4 py-3">
        <Coffee className="h-8 w-8 shrink-0 text-on-primary-container" aria-hidden />
        <p className="font-medium text-on-primary-container">
          ¡Buen día! Tu café, en buenas manos
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-error-container p-3 text-sm text-on-error-container"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="min-h-11 rounded-md border border-on-error-container/40 px-3 font-semibold hover:bg-on-error-container/10"
          >
            Reintentar
          </button>
        </div>
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
        <>
          <div className="mb-3">
            <label htmlFor="menu-search" className="sr-only">
              Buscar producto
            </label>
            <input
              id="menu-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto..."
              className="min-h-11 w-full rounded-md border border-outline-variant bg-white px-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoria(null)}
              aria-pressed={categoria === null}
              className={
                categoria === null
                  ? "flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary"
                  : "flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-outline-variant bg-white px-4 text-sm font-medium text-on-surface hover:border-primary hover:text-primary"
              }
            >
              <Utensils className="h-4 w-4" aria-hidden />
              Todos
            </button>
            {categorias.map((cat) => {
              const Icon = iconForCategoria(cat);
              const active = categoria === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoria(active ? null : cat)}
                  aria-pressed={active}
                  className={
                    active
                      ? "flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary"
                      : "flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-outline-variant bg-white px-4 text-sm font-medium text-on-surface hover:border-primary hover:text-primary"
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {cat}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-outline-variant bg-white/60 p-8 text-center text-on-surface-variant">
              <p className="font-medium">
                Sin resultados para “{query.trim() || categoria}”
              </p>
              <p className="mt-1 text-sm">Prueba con otro nombre o categoría.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((item) => (
                <div key={item.id} className="relative">
                  <DishCard item={item} />
                  {item.disponible ? (
                    <div className="mt-2">
                      <QuantityStepper
                        value={quantityOf(item.id)}
                        label={item.nombre}
                        onChange={(value) =>
                          setQuantity(
                            {
                              menuDiaId: item.id,
                              nombre: item.nombre,
                              precio: item.precio,
                            },
                            value,
                          )
                        }
                      />
                    </div>
                  ) : (
                    <div className="mt-2">
                      <QuantityStepper
                        value={0}
                        label={item.nombre}
                        disabled
                        onChange={() => undefined}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {count > 0 && (
        <Link
          to="/cart"
          className="fixed bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg hover:bg-primary/90"
        >
          <span>
            {count} producto{count === 1 ? "" : "s"} · ${formatCents(totalCents)}
          </span>
          <span className="rounded-full bg-on-primary px-3 py-0.5 text-primary">
            Ver pedido
          </span>
        </Link>
      )}
    </section>
  );
}
