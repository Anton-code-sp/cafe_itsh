import { useCallback, useEffect, useState } from "react";
import { getMenu } from "../../../lib/api";
import type { MenuItem } from "../../../lib/api";
import { DishCard } from "../../../components/dishes/DishCard";

export function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [fecha, setFecha] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getMenu();
      setItems(data.items);
      setFecha(data.fecha);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el menú");
    } finally {
      setLoading(false);
    }
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

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-amber-900">Menú del día</h1>
        {fecha && <span className="text-sm text-stone-500">{fecha}</span>}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-stone-500">Cargando menú…</p>}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-stone-500">
          <p className="font-medium">No hay menú publicado para hoy.</p>
          <p className="mt-1 text-sm">
            Vuelve a consultar en unos minutos; el menú se actualiza automáticamente.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <DishCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
