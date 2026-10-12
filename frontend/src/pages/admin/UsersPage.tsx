import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { SessionUser } from "../../lib/api";
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
        <h1 className="text-xl font-bold text-amber-900">Usuarios operativos</h1>
        <button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="h-10 rounded-md bg-amber-700 px-4 font-semibold text-white hover:bg-amber-800"
        >
          Crear usuario
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-100 text-stone-600">
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
              <tr key={u.id} className="border-t border-stone-100">
                <td className="px-4 py-3 font-medium">{u.nombre}</td>
                <td className="px-4 py-3">{u.correo}</td>
                <td className="px-4 py-3 capitalize">{u.rol}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      u.activo
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
                        : "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800"
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
                    className="text-amber-800 underline hover:text-amber-900"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
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
