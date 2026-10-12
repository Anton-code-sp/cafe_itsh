import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../lib/api";

interface Props {
  onRegistered: () => void;
}

export function RegisterForm({ onRegistered }: Props) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: { nombre: nombre.trim(), correo: correo.trim(), password },
      });
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold text-green-700">Cuenta creada</h2>
        <p className="mb-6 text-sm text-stone-600">
          Ya puedes iniciar sesión con tu correo y contraseña.
        </p>
        <button
          onClick={onRegistered}
          className="h-11 w-full rounded-md bg-amber-700 font-semibold text-white hover:bg-amber-800"
        >
          Ir a inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-4 text-xl font-bold text-amber-900">Registro de alumno/docente</h2>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <label className="mb-1 block text-sm font-medium" htmlFor="reg-nombre">
        Nombre
      </label>
      <input
        id="reg-nombre"
        required
        minLength={2}
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="mb-4 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
      />

      <label className="mb-1 block text-sm font-medium" htmlFor="reg-correo">
        Correo institucional
      </label>
      <input
        id="reg-correo"
        type="email"
        required
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        className="mb-4 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
      />

      <label className="mb-1 block text-sm font-medium" htmlFor="reg-password">
        Contraseña (mínimo 8 caracteres)
      </label>
      <input
        id="reg-password"
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-6 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
      />

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-md bg-amber-700 font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
      >
        {loading ? "Creando…" : "Crear cuenta"}
      </button>

      <button
        type="button"
        onClick={onRegistered}
        className="mt-4 h-11 w-full text-sm text-amber-800 underline hover:text-amber-900"
      >
        ¿Ya tienes cuenta? Inicia sesión
      </button>
    </form>
  );
}
