import { useCallback, useEffect, useState } from "react";
import { getDishes, updateDish } from "../../../lib/api";
import type { Dish } from "../../../lib/api";
import { Button } from "../../../components/ui/button";
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
        <h1 className="font-display text-headline-md text-on-surface">Platillos</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Crear platillo
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-error-container p-3 text-sm text-on-error-container"
        >
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-outline-variant bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-on-surface-variant">
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
              <tr key={d.id} className="border-t border-surface-container">
                <td className="px-4 py-3 font-medium">{d.nombre}</td>
                <td className="px-4 py-3">{d.categoria ?? "—"}</td>
                <td className="max-w-xs truncate px-4 py-3 text-on-surface-variant">
                  {d.descripcion ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    role="switch"
                    aria-checked={d.activo}
                    onClick={() => toggleActivo(d)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      d.activo ? "bg-primary" : "bg-surface-dim"
                    }`}
                    title={d.activo ? "Deshabilitar" : "Habilitar"}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                        d.activo ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                  <span className="ml-2 align-middle text-xs text-on-surface-variant">
                    {d.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditing(d);
                      setDialogOpen(true);
                    }}
                    className="text-primary underline underline-offset-4 hover:text-on-primary-container"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {dishes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">
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
