import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

export interface BottomBarTab {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  end?: boolean;
}

interface BottomBarProps {
  tabs: BottomBarTab[];
}

/** Barra inferior de 2 pestañas (≥56 px) para caja y cliente en móvil. */
export function BottomBar({ tabs }: BottomBarProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 grid h-14 border-t border-outline-variant bg-surface-container-low shadow-[0_-2px_8px_rgba(28,25,23,0.08)] md:hidden"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map(({ to, label, icon: Icon, badge, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `relative flex h-14 min-w-11 flex-col items-center justify-center gap-0.5 transition-colors ${
              isActive ? "font-semibold text-primary" : "text-on-surface-variant"
            }`
          }
        >
          <span className="relative">
            <Icon className="h-5 w-5" aria-hidden />
            {typeof badge === "number" && badge > 0 && (
              <span
                aria-label={`${badge} pendientes`}
                className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-on-primary"
              >
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </span>
          <span className="text-caption">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
