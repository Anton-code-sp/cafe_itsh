import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../lib/api";

interface UserLike {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
}

interface Props {
  user: UserLike | null;
  onClose: () => void;
  onSaved: () => void;
}

const ROLES = ["administrador", "cajero", "cocinero"] as const;

export function UserFormDialog({ user, onClose, onSaved }: Props) {
  const isEdit = user !== null;
  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [correo, setCorreo] = useState(user?.correo ?? "");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<string>(user?.rol ?? "cajero");
  const [activo, setActivo] = useState(user?.activo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    if (!isEdit && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await api(`/users/${user.id}`, {
          method: "PATCH",
          body: { nombre: nombre.trim(), correo: correo.trim(), rol, activo },
        });
      } else {
        await api("/users", {
          method: "POST",
          body: { nombre: nombre.trim(), correo: correo.trim(), password, rol },
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-bold text-amber-900">
          {isEdit ? "Editar usuario" : "Crear usuario operativo"}
        </h2>

        {error && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="mb-1 block text-sm font-medium" htmlFor="u-nombre">
          Nombre
        </label>
        <input
          id="u-nombre"
          required
          minLength={2}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mb-3 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="u-correo">
          Correo
        </label>
        <input
          id="u-correo"
          type="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="mb-3 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
        />

        {!isEdit && (
          <>
            <label className="mb-1 block text-sm font-medium" htmlFor="u-password">
              Contraseña (mínimo 8)
            </label>
            <input
              id="u-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-3 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
            />
          </>
        )}

        <label className="mb-1 block text-sm font-medium" htmlFor="u-rol">
          Rol
        </label>
        <select
          id="u-rol"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="mb-3 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {isEdit && (
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4"
            />
            Cuenta activa
          </label>
        )}

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="h-11 flex-1 rounded-md bg-amber-700 font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-md border border-stone-300 font-semibold hover:bg-stone-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
