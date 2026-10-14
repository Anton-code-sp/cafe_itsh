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
      className={`rounded-lg border p-4 shadow-sm ${
        noDisponible
          ? "border-outline-variant bg-surface-container opacity-60"
          : "border-outline-variant bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-title-md text-on-surface">{item.nombre}</h3>
        {item.especial && (
          <span className="shrink-0 rounded-full bg-tertiary px-2 py-0.5 text-caption font-semibold text-on-tertiary">
            Especial
          </span>
        )}
      </div>

      {item.descripcion && (
        <p className="mt-1 text-sm text-on-surface-variant">{item.descripcion}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="font-display text-lg font-bold text-on-surface">
          {formatPrecio(item.precio)}
        </span>
        {noDisponible ? (
          <span className="rounded-full bg-error-container px-2 py-0.5 text-caption font-semibold text-on-error-container">
            No disponible
          </span>
        ) : (
          <span className="rounded-full bg-primary-container px-2 py-0.5 text-caption font-semibold text-on-primary-container">
            Disponible
          </span>
        )}
      </div>
    </article>
  );
}
