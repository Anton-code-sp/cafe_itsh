import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";

export function CajaLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex h-14 items-center justify-between bg-espresso px-4 text-white">
        <span className="font-display font-bold">Cafetería ITSH · Caja</span>
        <div className="flex items-center gap-3 text-sm">
          <span>{user?.nombre}</span>
          <button
            onClick={logout}
            className="rounded-md bg-primary px-4 py-3 font-semibold hover:bg-primary/90"
          >
            Salir
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
        <p className="mt-6 text-center text-sm">
          <Link to="/menu" className="text-primary underline underline-offset-4">
            Ver menú
          </Link>
        </p>
      </main>
    </div>
  );
}
