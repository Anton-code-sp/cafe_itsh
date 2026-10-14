import { Outlet } from "react-router-dom";
import { CalendarDays, ClipboardList, Home, Users, UtensilsCrossed } from "lucide-react";
import { RoleNavDrawer, type NavItem } from "../../components/nav/RoleNavDrawer";

const NAV_ITEMS: NavItem[] = [
  { to: "/admin", label: "Inicio", icon: Home, end: true },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/platillos", label: "Platillos", icon: UtensilsCrossed },
  { to: "/admin/menu-dia", label: "Menú del día", icon: CalendarDays },
  { to: "/admin/reportes", label: "Reportes", icon: ClipboardList },
];

export function AdminLayout() {
  return (
    <RoleNavDrawer title="Cafetería ITSH · Admin" items={NAV_ITEMS} contentClassName="max-w-5xl pb-8">
      <Outlet />
    </RoleNavDrawer>
  );
}
