import { useState } from "react";
import type { FormEvent } from "react";
import { createDish, updateDish } from "../../lib/api";
import type { Dish } from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 font-display text-headline-md text-on-surface">
          {isEdit ? "Editar platillo" : "Crear platillo"}
        </h2>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-error-container p-3 text-sm text-on-error-container"
          >
            {error}
          </p>
        )}

        <Label className="mb-1 block" htmlFor="d-nombre">
          Nombre
        </Label>
        <Input
          id="d-nombre"
          required
          minLength={2}
          maxLength={100}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mb-3"
        />

        <Label className="mb-1 block" htmlFor="d-categoria">
          Categoría
        </Label>
        <Input
          id="d-categoria"
          maxLength={50}
          placeholder="Comida, Bebida…"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="mb-3"
        />

        <Label className="mb-1 block" htmlFor="d-descripcion">
          Descripción
        </Label>
        <textarea
          id="d-descripcion"
          maxLength={500}
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mb-3 w-full rounded-md border border-outline bg-white px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none"
        />

        {isEdit && (
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Platillo activo en el catálogo
          </label>
        )}

        <div className="mt-2 flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Guardando…" : "Guardar"}
          </Button>
          <Button type="button" onClick={onClose} variant="outline" className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
