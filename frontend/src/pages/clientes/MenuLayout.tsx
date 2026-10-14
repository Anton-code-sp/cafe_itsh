import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { ClipboardList, Coffee, ShoppingCart } from "lucide-react";
import { RoleNavDrawer, type NavItem } from "../../components/nav/RoleNavDrawer";
import { BottomBar, type BottomBarTab } from "../../components/nav/BottomBar";
import { getMyOrders } from "../../lib/api";
import { useCart } from "../../lib/cart-context";

export function MenuLayout() {
  const { count } = useCart();
  const [readyForPickup, setReadyForPickup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getMyOrders()
        .then(({ orders }) => {
          if (!cancelled) setReadyForPickup(orders.some((o) => o.estado === "Listo"));
        })
        .catch(() => undefined);
    };
    load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const items: NavItem[] = [
    { to: "/menu", label: "Menú del día", icon: Coffee },
    { to: "/mis-pedidos", label: "Mis pedidos", icon: ClipboardList, badge: readyForPickup ? 1 : 0 },
  ];

  const tabs: BottomBarTab[] = [
    { to: "/menu", label: "Menú", icon: Coffee },
    {
      to: "/mis-pedidos",
      label: "Mis pedidos",
      icon: ClipboardList,
      badge: readyForPickup ? 1 : 0,
    },
  ];

  return (
    <>
      <RoleNavDrawer
        title="Cafetería ITSH"
        items={items}
        contentClassName="max-w-3xl pb-24"
      >
        <div className="mb-4 flex justify-end">
          <Link
            to="/cart"
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-4 text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            aria-label={`Ver pedido, ${count} productos`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden />
            Pedido
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-container px-1 text-caption font-bold text-on-primary-container">
                {count}
              </span>
            )}
          </Link>
        </div>
        <Outlet />
      </RoleNavDrawer>
      <BottomBar tabs={tabs} />
    </>
  );
}
