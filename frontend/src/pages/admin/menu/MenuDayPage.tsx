import { useCallback, useEffect, useState } from "react";
import { getDishes, getMenuDay, updateMenuDayRow } from "../../../lib/api";
import type { Dish, MenuDayRow } from "../../../lib/api";
import { PublishDishDialog } from "../../../components/menu/PublishDishDialog";

function localDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function MenuDayPage() {
  const [fecha, setFecha] = useState(localDate());
  const [rows, setRows] = useState<MenuDayRow[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);

  const load = useCallback(() => {
    getMenuDay(fecha)
      .then((data) => {
        setRows(data.items);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar el menú");
      })
      .finally(() => setLoading(false));
  }, [fecha]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getDishes()
      .then((data) => setDishes(data.dishes))
      .catch(() => setDishes([]));
  }, []);

  async function patchRow(id: number, changes: { precio?: number; disponible?: boolean; especial?: boolean }) {
    try {
      await updateMenuDayRow(id, changes);
      setError(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la fila");
      load();
    }
  }

  function savePrecio(id: number, valor: string) {
    const num = Number(valor);
    if (valor === "" || Number.isNaN(num) || num < 0) {
      setError("El precio debe ser un número mayor o igual a 0");
      load();
      return;
    }
    const actual = rows.find((r) => r.id === id);
    if (actual && Number(actual.precio) !== num) {
      void patchRow(id, { precio: num });
    }
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-amber-900">Menú del día</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium" htmlFor="md-fecha">
            Fecha
          </label>
          <input
            id="md-fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value || localDate())}
            className="h-10 rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
          />
          <button
            onClick={() => setPublishOpen(true)}
            className="h-10 rounded-md bg-amber-700 px-4 font-semibold text-white hover:bg-amber-800"
          >
            Publicar platillo
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">Cargando menú…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100 text-stone-600">
              <tr>
                <th className="px-4 py-3">Platillo</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Disponible</th>
                <th className="px-4 py-3">Especial</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-stone-100">
                  <td className="px-4 py-3">
                    <span className="font-medium">{r.nombre}</span>
                    {!r.disponible_en_catalogo && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        fuera de catálogo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-500">$</span>
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        defaultValue={r.precio}
                        onBlur={(e) => savePrecio(r.id, e.target.value)}
                        aria-label={`Precio de ${r.nombre}`}
                        className="h-9 w-24 rounded-md border border-stone-300 px-2 focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      role="switch"
                      aria-checked={r.disponible}
                      onClick={() => patchRow(r.id, { disponible: !r.disponible })}
                      aria-label={`Disponible: ${r.nombre}`}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        r.disponible ? "bg-green-600" : "bg-stone-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                          r.disponible ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      role="switch"
                      aria-checked={r.especial}
                      onClick={() => patchRow(r.id, { especial: !r.especial })}
                      aria-label={`Especial: ${r.nombre}`}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        r.especial ? "bg-amber-600" : "bg-stone-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                          r.especial ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                    No hay platillos publicados para esta fecha.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {publishOpen && (
        <PublishDishDialog
          dishes={dishes}
          fecha={fecha}
          onClose={() => setPublishOpen(false)}
          onSaved={() => {
            setPublishOpen(false);
            load();
          }}
        />
      )}
    </section>
  );
}
