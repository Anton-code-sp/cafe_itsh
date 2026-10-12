import type { MenuItem } from "../../lib/api";

function formatPrecio(precio: string): string {
  return Number(precio).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export function DishCard({ item }: { item: MenuItem }) {
  const noDisponible = !item.disponible;

  return (
    <article
      aria-disabled={noDisponible}
      className={`rounded-lg border p-4 ${
        noDisponible
          ? "border-stone-200 bg-stone-50 opacity-60"
          : "border-stone-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-amber-950">{item.nombre}</h3>
        {item.especial && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            Especial
          </span>
        )}
      </div>

      {item.descripcion && (
        <p className="mt-1 text-sm text-stone-600">{item.descripcion}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-bold text-amber-900">
          {formatPrecio(item.precio)}
        </span>
        {noDisponible ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
            No disponible
          </span>
        ) : (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
            Disponible
          </span>
        )}
      </div>
    </article>
  );
}
