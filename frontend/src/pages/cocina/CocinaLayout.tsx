import { Link } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";

export function CocinaLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex h-14 items-center justify-between bg-espresso px-4 text-white">
        <span className="font-display font-bold">Cafetería ITSH · Cocina</span>
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
        <div className="rounded-lg border border-dashed border-outline-variant bg-white/60 p-8 text-center text-on-surface-variant">
          Pantalla de cocina (KDS) — disponible en el Sprint 4
        </div>
        <p className="mt-4 text-center text-sm">
          <Link to="/menu" className="text-primary underline underline-offset-4">
            Ver menú
          </Link>
        </p>
      </main>
    </div>
  );
}
