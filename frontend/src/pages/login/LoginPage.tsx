import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { RegisterForm } from "./RegisterForm";

export function LoginPage() {
  const { login, homePath } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(correo.trim(), password);
      navigate(homePath(user.rol), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  if (showRegister) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
          <RegisterForm onRegistered={() => setShowRegister(false)} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg"
      >
        <h1 className="mb-1 text-2xl font-bold text-amber-900">
          Cafetería ITSH
        </h1>
        <p className="mb-6 text-sm text-stone-600">
          Sistema de pedidos anticipados
        </p>

        {error && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="mb-1 block text-sm font-medium" htmlFor="correo">
          Correo
        </label>
        <input
          id="correo"
          type="email"
          required
          autoComplete="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="mb-4 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 h-11 w-full rounded-md border border-stone-300 px-3 focus:border-amber-600 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-md bg-amber-700 font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Iniciar sesión"}
        </button>

        <button
          type="button"
          onClick={() => setShowRegister(true)}
          className="mt-4 h-11 w-full text-sm text-amber-800 underline hover:text-amber-900"
        >
          ¿No tienes cuenta? Regístrate
        </button>
      </form>
    </main>
  );
}
