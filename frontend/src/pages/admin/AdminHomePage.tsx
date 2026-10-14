import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ClipboardList, Users, UtensilsCrossed } from "lucide-react";
import { api, getDishes, getMenuDay } from "../../lib/api";
import type { MenuDayRow, SessionUser } from "../../lib/api";

type OperativeUser = SessionUser & { activo: boolean };

interface HomeData {
  usuariosActivos: number;
  platillos: number;
  menuItems: MenuDayRow[];
}

export function AdminHomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api<{ users: OperativeUser[] }>("/users"),
      getDishes(),
      getMenuDay(),
    ])
      .then(([usersRes, dishesRes, menuRes]) => {
        setData({
          usuariosActivos: usersRes.users.filter((u) => u.activo).length,
          platillos: dishesRes.dishes.filter((d) => d.activo).length,
          menuItems: menuRes.items,
        });
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar el inicio");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fechaHoy = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const cards = [
    {
      to: "/admin/usuarios",
      label: "Usuarios",
      hint: data ? `${data.usuariosActivos} activos` : "…",
      icon: Users,
    },
    {
      to: "/admin/platillos",
      label: "Platillos",
      hint: data ? `${data.platillos} en catálogo` : "…",
      icon: UtensilsCrossed,
    },
    {
      to: "/admin/menu-dia",
      label: "Menú del día",
      hint: data ? `${data.menuItems.length} publicados hoy` : "…",
      icon: CalendarDays,
    },
    {
      to: "/admin/reportes",
      label: "Reportes",
      hint: "Ventas por rango",
      icon: ClipboardList,
    },
  ];

  return (
    <section>
      <header className="mb-6">
        <p className="text-label-md capitalize text-on-surface-variant">{fechaHoy}</p>
        <h1 className="font-display text-headline-md text-on-surface">Inicio</h1>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-outline-variant bg-error-container p-4 text-sm text-on-error-container">
          <p>{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-2 min-h-11 rounded-md bg-error px-4 font-semibold text-on-error"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map(({ to, label, hint, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-24 items-center gap-4 rounded-lg border border-outline-variant bg-white p-4 transition-colors hover:bg-surface-container-low"
          >
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container"
            >
              <Icon className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-title-md font-bold text-on-surface">
                {label}
              </span>
              <span className="block text-label-md text-on-surface-variant">{hint}</span>
            </span>
          </Link>
        ))}
      </div>

      <h2 className="mt-8 font-display text-title-md font-bold text-on-surface">
        Menú de hoy
      </h2>
      {!data || data.menuItems.length === 0 ? (
        <p className="mt-2 rounded-lg border border-outline-variant bg-white p-4 text-sm text-on-surface-variant">
          {data ? "Sin platillos publicados para hoy." : "Cargando…"}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-surface-container overflow-hidden rounded-lg border border-outline-variant bg-white">
          {data.menuItems.map((item) => (
            <li
              key={item.id}
              className={`flex min-h-14 items-center gap-3 px-4 py-2 ${
                item.disponible ? "" : "opacity-50"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-base font-medium text-on-surface">
                  {item.nombre}
                </span>
                <span className="block text-caption text-on-surface-variant">
                  ${item.precio}
                </span>
              </span>
              {item.especial && (
                <span className="shrink-0 rounded-full bg-espresso px-2 py-0.5 text-caption font-semibold text-white">
                  Especial
                </span>
              )}
              {!item.disponible && (
                <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 text-caption font-semibold text-on-surface-variant">
                  No disponible
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
