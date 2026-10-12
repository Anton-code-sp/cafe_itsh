import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between bg-amber-900 px-4 text-white">
        <nav className="flex items-center gap-6">
          <span className="font-bold">Cafetería ITSH · Admin</span>
          <Link to="/admin" className="text-sm underline-offset-4 hover:underline">
            Usuarios
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>{user?.nombre}</span>
          <button onClick={logout} className="rounded bg-amber-700 px-3 py-1.5 hover:bg-amber-600">
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
