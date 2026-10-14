import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { SessionUser } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { UserFormDialog } from "../../components/users/UserFormDialog";

type OperativeUser = SessionUser & { activo: boolean };

export function UsersPage() {
  const [users, setUsers] = useState<OperativeUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OperativeUser | null>(null);

  const load = useCallback(() => {
    api<{ users: OperativeUser[] }>("/users")
      .then((data) => {
        setUsers(data.users);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar usuarios");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-headline-md text-on-surface">
          Usuarios operativos
        </h1>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Crear usuario
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-error-container p-3 text-sm text-on-error-container"
        >
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-outline-variant bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-surface-container">
                <td className="px-4 py-3 font-medium">{u.nombre}</td>
                <td className="px-4 py-3">{u.correo}</td>
                <td className="px-4 py-3 capitalize">{u.rol}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      u.activo
                        ? "rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-on-primary-container"
                        : "rounded-full bg-error-container px-2 py-0.5 text-xs font-semibold text-on-error-container"
                    }
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditing(u);
                      setDialogOpen(true);
                    }}
                    className="text-primary underline underline-offset-4 hover:text-on-primary-container"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">
                  No hay usuarios operativos todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <UserFormDialog
          user={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            setDialogOpen(false);
            load();
          }}
        />
      )}
    </section>
  );
}
