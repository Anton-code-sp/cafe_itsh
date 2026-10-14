import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { getMenu, type MenuItem } from "../../lib/api";
import { useCajaCart } from "../../lib/caja-cart-context";
import { formatCents } from "../../lib/money";
import { QuantityStepper } from "../../components/counter/QuantityStepper";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const CATEGORY_ICONS: Record<string, string> = {
  Bebidas: "☕",
  Comida: "🍽️",
  Snacks: "🥐",
  Postres: "🍰",
};

export function CapturePage() {
  const navigate = useNavigate();
  const { lines, clienteNombre, totalCents, count, addLine, setQuantity, setClienteNombre } =
    useCajaCart();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    getMenu()
      .then((res) => {
        setMenu(res.items);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar el menú de hoy");
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of menu) {
      if (item.categoria) set.add(item.categoria);
    }
    return [...set].sort();
  }, [menu]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu.filter((m) => {
      if (category && m.categoria !== category) return false;
      if (!q) return true;
      return m.nombre.toLowerCase().includes(q);
    });
  }, [menu, query, category]);

  const quantityOf = (menuDiaId: number) =>
    lines.find((l) => l.menuDiaId === menuDiaId)?.cantidad ?? 0;

  return (
    <section>
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          aria-label="Regresar a inicio de caja"
          onClick={() => navigate("/caja")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-outline-variant bg-white text-on-surface hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <h1 className="font-display text-headline-md text-on-surface">Nuevo pedido</h1>
      </header>

      <div className="mb-4 space-y-1.5">
        <Label htmlFor="cliente-nombre">Cliente (opcional)</Label>
        <Input
          id="cliente-nombre"
          placeholder="Nombre del cliente"
          value={clienteNombre}
          onChange={(e) => setClienteNombre(e.target.value)}
        />
      </div>

      <div className="relative mb-3">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
          aria-hidden
        />
        <Input
          id="buscar-producto"
          aria-label="Buscar producto"
          placeholder="Buscar producto…"
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {categories.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Categorías">
          <button
            type="button"
            onClick={() => setCategory(null)}
            aria-pressed={category === null}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-label-md font-semibold transition-colors ${
              category === null
                ? "border-primary bg-primary-container text-on-primary-container"
                : "border-outline-variant bg-white text-on-surface-variant"
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-label-md font-semibold transition-colors ${
                category === cat
                  ? "border-primary bg-primary-container text-on-primary-container"
                  : "border-outline-variant bg-white text-on-surface-variant"
              }`}
            >
              {CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ""}
              {cat}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-outline-variant bg-error-container p-4 text-sm text-on-error-container">
          <p>{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-2 min-h-11 rounded-md bg-error px-4 font-semibold text-on-error"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loaded && !error && (
        <p className="rounded-lg border border-outline-variant bg-white p-4 text-sm text-on-surface-variant">
          Cargando menú…
        </p>
      )}

      {loaded && !error && menu.length === 0 && (
        <p className="rounded-lg border border-outline-variant bg-white p-4 text-sm text-on-surface-variant">
          No hay platillos disponibles en el menú de hoy.
        </p>
      )}

      {loaded && !error && menu.length > 0 && filtered.length === 0 && (
        <p className="rounded-lg border border-outline-variant bg-white p-4 text-sm text-on-surface-variant">
          Sin resultados{query ? ` para “${query}”` : ""}.
        </p>
      )}

      {filtered.length > 0 && (
        <ul className="divide-y divide-outline-variant overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
          {filtered.map((item) => {
            const qty = quantityOf(item.id);
            return (
              <li key={item.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-base font-medium text-on-surface">
                    {item.nombre}
                    {item.especial && (
                      <span className="ml-2 rounded-full bg-espresso px-2 py-0.5 align-middle text-caption font-semibold text-white">
                        Especial
                      </span>
                    )}
                  </p>
                  <p className="font-display text-body-base font-bold text-on-surface">
                    ${item.precio}
                  </p>
                </div>
                <QuantityStepper
                  value={qty}
                  onChange={(cantidad) => setQuantity(item.id, cantidad)}
                  disabled={!item.disponible}
                  label={item.nombre}
                />
                {qty === 0 && (
                  <button
                    type="button"
                    disabled={!item.disponible}
                    onClick={() =>
                      addLine({ menuDiaId: item.id, nombre: item.nombre, precio: item.precio })
                    }
                    className="min-h-11 shrink-0 rounded-md bg-primary px-4 text-label-md font-semibold text-on-primary hover:bg-primary/90 disabled:opacity-40"
                  >
                    Agregar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-14 z-20 border-t border-outline-variant bg-surface-container-low p-3 shadow-[0_-2px_8px_rgba(28,25,23,0.08)] md:inset-x-auto md:bottom-4 md:right-4 md:rounded-lg md:border">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <p className="min-w-0">
              <span className="block text-label-md text-on-surface-variant">
                {count} platillo{count === 1 ? "" : "s"}
              </span>
              <span className="block font-display text-headline-md font-bold text-on-surface">
                ${formatCents(totalCents)}
              </span>
            </p>
            <Link
              to="/caja/cobro"
              className="flex min-h-12 shrink-0 items-center rounded-md bg-primary px-6 font-display text-title-md font-bold text-on-primary hover:bg-primary/90"
            >
              Ver cobro
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
