import { useState } from "react";
import type { FormEvent } from "react";
import { createDish, updateDish } from "../../lib/api";
import type { Dish } from "../../lib/api";

interface Props {
  dish: Dish | null;
  onClose: () => void;
  onSaved: () => void;
}

export function DishFormDialog({ dish, onClose, onSaved }: Props) {
  const isEdit = dish !== null;
  const [nombre, setNombre] = useState(dish?.nombre ?? "");
  const [categoria, setCategoria] = useState(dish?.categoria ?? "");
  const [descripcion, setDescripcion] = useState(dish?.descripcion ?? "");
  const [activo, setActivo] = useState(dish?.activo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const nombreTrim = nombre.trim();
    if (nombreTrim.length < 2 || nombreTrim.length > 100) {
      setError("El nombre debe tener entre 2 y 100 caracteres");
      return;
    }
    if (categoria.trim().length > 50) {
      setError("La categoría no puede exceder 50 caracteres");
      return;
    }
    if (descripcion.trim().length > 500) {
      setError("La descripción es demasiado larga");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateDish(dish.id, {
          nombre: nombreTrim,
          categoria: categoria.trim() || undefined,
          descripcion: descripcion.trim() || undefined,
          activo,
        });
      } else {
        await createDish({
          nombre: nombreTrim,
          categoria: categoria.trim() || undefined,
          descripcion: descripcion.trim() || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-bold text-amber-900">
          {isEdit ? "Editar platillo" : "Crear platillo"}
        </h2>

        {error && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="mb-1 block text-sm font-medium" htmlFor="d-nombre">
          Nombre
        </label>
        <input
          id="d-nombre"
          required
          minLength={2}
          maxLength={100}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mb-3 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="d-categoria">
          Categoría
        </label>
        <input
          id="d-categoria"
          maxLength={50}
          placeholder="Comida, Bebida…"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="mb-3 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="d-descripcion">
          Descripción
        </label>
        <textarea
          id="d-descripcion"
          maxLength={500}
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mb-3 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
        />

        {isEdit && (
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4"
            />
            Platillo activo en el catálogo
          </label>
        )}

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="h-11 flex-1 rounded-md bg-amber-700 font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-md border border-stone-300 font-semibold hover:bg-stone-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
