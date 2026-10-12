import { Link } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";

export function CajaLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between bg-amber-900 px-4 text-white">
        <span className="font-bold">Cafetería ITSH · Caja</span>
        <div className="flex items-center gap-3 text-sm">
          <span>{user?.nombre}</span>
          <button onClick={logout} className="rounded bg-amber-700 px-3 py-1.5 hover:bg-amber-600">
            Salir
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-stone-500">
          Pantalla de caja — disponible en el Sprint 4
        </div>
        <p className="mt-4 text-center text-sm">
          <Link to="/menu" className="text-amber-800 underline">
            Ver menú
          </Link>
        </p>
      </main>
    </div>
  );
}
