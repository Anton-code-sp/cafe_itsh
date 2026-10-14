import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Banknote, Home, PackageCheck, ShoppingCart } from "lucide-react";
import { RoleNavDrawer, type NavItem } from "../../components/nav/RoleNavDrawer";
import { BottomBar, type BottomBarTab } from "../../components/nav/BottomBar";
import { listReadyOrders } from "../../lib/api";

export function CajaLayout() {
  const [readyCount, setReadyCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      listReadyOrders()
        .then(({ orders }) => {
          if (!cancelled) setReadyCount(orders.length);
        })
        .catch(() => undefined);
    };
    load();
    const timer = window.setInterval(load, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const items: NavItem[] = [
    { to: "/caja", label: "Inicio", icon: Home, end: true },
    { to: "/caja/capturar", label: "Capturar pedido", icon: ShoppingCart },
    { to: "/caja/cobro", label: "Cobro", icon: Banknote },
    { to: "/caja/entregas", label: "Entregas", icon: PackageCheck, badge: readyCount },
  ];

  const tabs: BottomBarTab[] = [
    { to: "/caja", label: "Caja", icon: ShoppingCart, end: true },
    { to: "/caja/entregas", label: "Entregas", icon: PackageCheck, badge: readyCount },
  ];

  return (
    <>
      <RoleNavDrawer
        title="Cafetería ITSH · Caja"
        items={items}
        contentClassName="max-w-6xl pb-24"
      >
        <Outlet />
      </RoleNavDrawer>
      <BottomBar tabs={tabs} />
    </>
  );
}
