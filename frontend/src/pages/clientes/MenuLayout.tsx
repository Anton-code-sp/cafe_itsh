import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { useCart } from "../../lib/cart-context";

export function MenuLayout() {
  const { user, logout } = useAuth();
  const { count } = useCart();

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between bg-amber-900 px-4 text-white">
        <nav className="flex items-center gap-6">
          <Link to="/menu" className="font-bold">
            Cafetería ITSH
          </Link>
          <Link to="/menu" className="text-sm underline-offset-4 hover:underline">
            Menú
          </Link>
          <Link to="/mis-pedidos" className="text-sm underline-offset-4 hover:underline">
            Mis pedidos
          </Link>
          <Link
            to="/cart"
            className="flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
          >
            Carrito
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1 text-xs font-bold text-amber-900">
                {count}
              </span>
            )}
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>{user?.nombre}</span>
          <button onClick={logout} className="rounded bg-amber-700 px-3 py-1.5 hover:bg-amber-600">
            Salir
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
