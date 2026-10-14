import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LogOut, Menu, User, X, type LucideIcon } from "lucide-react";
import { useAuth } from "../../lib/auth-context";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  end?: boolean;
}

interface RoleNavDrawerProps {
  title: string;
  items: NavItem[];
  children: ReactNode;
  /** Clases del contenedor de contenido (ancho máximo + padding inferior). */
  contentClassName?: string;
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map(({ to, label, icon: Icon, badge, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-lg px-3 text-label-md transition-colors ${
              isActive
                ? "bg-primary-container font-semibold text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`
          }
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {typeof badge === "number" && badge > 0 && (
            <span
              aria-label={`${badge} pendientes`}
              className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-caption font-bold text-on-primary"
            >
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function RoleNavDrawer({
  title,
  items,
  children,
  contentClassName = "max-w-5xl pb-8",
}: RoleNavDrawerProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const profile = user ? (
    <div className="flex items-center gap-3 px-5 py-4">
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container"
      >
        <User className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-title-md text-on-surface">{user.nombre}</p>
        <p className="truncate text-caption uppercase tracking-wide text-on-surface-variant">
          {user.rol}
        </p>
      </div>
    </div>
  ) : null;

  const logoutButton = (
    <button
      type="button"
      onClick={logout}
      className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high"
    >
      <LogOut className="h-5 w-5" aria-hidden />
      Cerrar sesión
    </button>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Panel lateral fijo (escritorio ≥768 px) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-outline-variant bg-surface-container-low md:flex">
        <p className="px-5 pb-1 pt-4 font-display text-title-md font-bold text-on-surface">
          {title}
        </p>
        {profile}
        <div className="mx-5 border-t border-outline-variant" />
        <div className="flex-1 overflow-y-auto py-4">
          <NavList items={items} />
        </div>
        <div className="border-t border-outline-variant p-3">{logoutButton}</div>
      </aside>

      {/* Drawer superpuesto (móvil <768 px) */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú de navegación"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-on-surface/40"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface-container-low shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4">
              <p className="min-w-0 truncate font-display text-title-md font-bold text-on-surface">
                {title}
              </p>
              <button
                type="button"
                aria-label="Cerrar menú de navegación"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {profile}
            <div className="mx-5 border-t border-outline-variant" />
            <div className="flex-1 overflow-y-auto py-4">
              <NavList items={items} onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-outline-variant p-3">{logoutButton}</div>
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 bg-espresso px-4 text-white">
          <button
            type="button"
            aria-label="Abrir menú de navegación"
            onClick={() => setOpen(true)}
            className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-white/10 md:hidden"
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>
          <span className="min-w-0 flex-1 truncate font-display font-bold">{title}</span>
          {user && (
            <span className="hidden shrink-0 text-sm text-white/80 md:inline">{user.nombre}</span>
          )}
        </header>
        <main className={`mx-auto w-full p-4 sm:p-6 ${contentClassName}`}>{children}</main>
      </div>
    </div>
  );
}
