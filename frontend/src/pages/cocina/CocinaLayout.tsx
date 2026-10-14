import { Outlet } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { RoleNavDrawer, type NavItem } from "../../components/nav/RoleNavDrawer";

const NAV_ITEMS: NavItem[] = [{ to: "/cocina", label: "Pedidos", icon: ClipboardList }];

export function CocinaLayout() {
  return (
    <RoleNavDrawer
      title="Cafetería ITSH · Cocina"
      items={NAV_ITEMS}
      contentClassName="max-w-6xl pb-8"
    >
      <Outlet />
    </RoleNavDrawer>
  );
}
