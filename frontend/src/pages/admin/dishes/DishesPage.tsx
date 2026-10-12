import { useCallback, useEffect, useState } from "react";
import { getDishes, updateDish } from "../../../lib/api";
import type { Dish } from "../../../lib/api";
import { DishFormDialog } from "../../../components/dishes/DishFormDialog";

export function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);

  const load = useCallback(() => {
    getDishes()
      .then((data) => {
        setDishes(data.dishes);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar platillos");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActivo(dish: Dish) {
    try {
      await updateDish(dish.id, { activo: !dish.activo });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el platillo");
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-900">Platillos</h1>
        <button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="h-10 rounded-md bg-amber-700 px-4 font-semibold text-white hover:bg-amber-800"
        >
          Crear platillo
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-100 text-stone-600">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {dishes.map((d) => (
              <tr key={d.id} className="border-t border-stone-100">
                <td className="px-4 py-3 font-medium">{d.nombre}</td>
                <td className="px-4 py-3">{d.categoria ?? "—"}</td>
                <td className="max-w-xs truncate px-4 py-3 text-stone-600">
                  {d.descripcion ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    role="switch"
                    aria-checked={d.activo}
                    onClick={() => toggleActivo(d)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      d.activo ? "bg-green-600" : "bg-stone-300"
                    }`}
                    title={d.activo ? "Deshabilitar" : "Habilitar"}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                        d.activo ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                  <span className="ml-2 align-middle text-xs text-stone-500">
                    {d.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditing(d);
                      setDialogOpen(true);
                    }}
                    className="text-amber-800 underline hover:text-amber-900"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {dishes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No hay platillos en el catálogo todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <DishFormDialog
          dish={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            setDialogOpen(false);
            load();
          }}
        />
      )}
    </section>
  );
}
