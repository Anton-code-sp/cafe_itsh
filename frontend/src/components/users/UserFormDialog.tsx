import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 font-display text-headline-md text-on-surface">
          {isEdit ? "Editar usuario" : "Crear usuario operativo"}
        </h2>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-error-container p-3 text-sm text-on-error-container"
          >
            {error}
          </p>
        )}

        <Label className="mb-1 block" htmlFor="u-nombre">
          Nombre
        </Label>
        <Input
          id="u-nombre"
          required
          minLength={2}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mb-3"
        />

        <Label className="mb-1 block" htmlFor="u-correo">
          Correo
        </Label>
        <Input
          id="u-correo"
          type="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="mb-3"
        />

        {!isEdit && (
          <>
            <Label className="mb-1 block" htmlFor="u-password">
              Contraseña (mínimo 8)
            </Label>
            <Input
              id="u-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-3"
            />
          </>
        )}

        <Label className="mb-1 block" htmlFor="u-rol">
          Rol
        </Label>
        <select
          id="u-rol"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="mb-3 h-11 w-full rounded-md border border-outline bg-white px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none"
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
              className="h-4 w-4 accent-primary"
            />
            Cuenta activa
          </label>
        )}

        <div className="mt-2 flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Guardando…" : "Guardar"}
          </Button>
          <Button type="button" onClick={onClose} variant="outline" className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
