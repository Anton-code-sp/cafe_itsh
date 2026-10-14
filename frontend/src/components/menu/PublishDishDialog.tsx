import { useState } from "react";
import type { FormEvent } from "react";
import { publishMenuDay } from "../../lib/api";
import type { Dish } from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 font-display text-headline-md text-on-surface">
          Publicar en el menú del día
        </h2>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-error-container p-3 text-sm text-on-error-container"
          >
            {error}
          </p>
        )}

        <Label className="mb-1 block" htmlFor="p-platillo">
          Platillo
        </Label>
        <select
          id="p-platillo"
          required
          value={platilloId}
          onChange={(e) => setPlatilloId(e.target.value)}
          className="mb-3 h-11 w-full rounded-md border border-outline bg-white px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none"
        >
          {dishes
            .filter((d) => d.activo)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
        </select>

        <Label className="mb-1 block" htmlFor="p-fecha">
          Fecha
        </Label>
        <Input
          id="p-fecha"
          type="date"
          required
          value={fechaValue}
          onChange={(e) => setFechaValue(e.target.value)}
          className="mb-3"
        />

        <Label className="mb-1 block" htmlFor="p-precio">
          Precio (se congela al publicar)
        </Label>
        <Input
          id="p-precio"
          type="number"
          required
          min={0}
          step="0.5"
          placeholder="40"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="mb-3"
        />

        <label className="mb-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={especial}
            onChange={(e) => setEspecial(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Marcar como especial del día
        </label>

        <div className="mt-2 flex gap-3">
          <Button
            type="submit"
            disabled={loading || !platilloId}
            className="flex-1"
          >
            {loading ? "Publicando…" : "Publicar"}
          </Button>
          <Button type="button" onClick={onClose} variant="outline" className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
