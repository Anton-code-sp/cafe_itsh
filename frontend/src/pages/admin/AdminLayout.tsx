import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex h-14 items-center justify-between bg-espresso px-4 text-white">
        <nav className="flex items-center gap-6">
          <span className="font-display font-bold">Cafetería ITSH · Admin</span>
          <Link to="/admin" className="text-sm underline-offset-4 hover:underline">
            Usuarios
          </Link>
          <Link to="/admin/platillos" className="text-sm underline-offset-4 hover:underline">
            Platillos
          </Link>
          <Link to="/admin/menu-dia" className="text-sm underline-offset-4 hover:underline">
            Menú del día
          </Link>
          <Link to="/admin/reportes" className="text-sm underline-offset-4 hover:underline">
            Reportes
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>{user?.nombre}</span>
          <button
            onClick={logout}
            className="rounded-md bg-primary px-3 py-1.5 font-semibold hover:bg-primary/90"
          >
            Salir
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
