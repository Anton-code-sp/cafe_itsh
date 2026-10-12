import { useState } from "react";
import type { FormEvent } from "react";
import { publishMenuDay } from "../../lib/api";
import type { Dish } from "../../lib/api";

interface Props {
  dishes: Dish[];
  fecha: string;
  onClose: () => void;
  onSaved: () => void;
}

export function PublishDishDialog({ dishes, fecha, onClose, onSaved }: Props) {
  const [platilloId, setPlatilloId] = useState<string>(
    dishes.length > 0 ? String(dishes[0].id) : "",
  );
  const [fechaValue, setFechaValue] = useState(fecha);
  const [precio, setPrecio] = useState("");
  const [especial, setEspecial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const precioNum = Number(precio);
    if (precio === "" || Number.isNaN(precioNum) || precioNum < 0) {
      setError("El precio debe ser un número mayor o igual a 0");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaValue)) {
      setError("Fecha inválida");
      return;
    }

    setLoading(true);
    try {
      await publishMenuDay({
        fecha: fechaValue,
        platilloId: Number(platilloId),
        precio: precioNum,
        especial,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
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
        <h2 className="mb-4 text-lg font-bold text-amber-900">Publicar en el menú del día</h2>

        {error && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="mb-1 block text-sm font-medium" htmlFor="p-platillo">
          Platillo
        </label>
        <select
          id="p-platillo"
          required
          value={platilloId}
          onChange={(e) => setPlatilloId(e.target.value)}
          className="mb-3 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
        >
          {dishes
            .filter((d) => d.activo)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
        </select>

        <label className="mb-1 block text-sm font-medium" htmlFor="p-fecha">
          Fecha
        </label>
        <input
          id="p-fecha"
          type="date"
          required
          value={fechaValue}
          onChange={(e) => setFechaValue(e.target.value)}
          className="mb-3 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="p-precio">
          Precio (se congela al publicar)
        </label>
        <input
          id="p-precio"
          type="number"
          required
          min={0}
          step="0.5"
          placeholder="40"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="mb-3 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
        />

        <label className="mb-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={especial}
            onChange={(e) => setEspecial(e.target.checked)}
            className="h-4 w-4"
          />
          Marcar como especial del día
        </label>

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            disabled={loading || !platilloId}
            className="h-11 flex-1 rounded-md bg-amber-700 font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
          >
            {loading ? "Publicando…" : "Publicar"}
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
