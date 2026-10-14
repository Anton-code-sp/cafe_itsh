import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0 && !roles.includes(user.rol)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-display text-2xl font-bold text-error">Acceso denegado</h1>
        <p className="text-on-surface-variant">
          Tu rol <span className="font-semibold">{user.rol}</span> no tiene permiso
          para ver esta página.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
