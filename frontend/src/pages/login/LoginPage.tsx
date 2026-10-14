import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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
      <main className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-8 shadow-lg">
          <RegisterForm onRegistered={() => setShowRegister(false)} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-8 shadow-lg"
      >
        <h1 className="mb-1 font-display text-headline-lg text-on-surface">
          Cafetería ITSH
        </h1>
        <p className="mb-6 text-sm text-on-surface-variant">
          Sistema de pedidos anticipados
        </p>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-error-container p-3 text-sm text-on-error-container"
          >
            {error}
          </p>
        )}

        <Label className="mb-1 block" htmlFor="correo">
          Correo
        </Label>
        <Input
          id="correo"
          type="email"
          required
          autoComplete="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="mb-4"
        />

        <Label className="mb-1 block" htmlFor="password">
          Contraseña
        </Label>
        <Input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Entrando…" : "Iniciar sesión"}
        </Button>

        <button
          type="button"
          onClick={() => setShowRegister(true)}
          className="mt-4 h-11 w-full text-sm text-primary underline underline-offset-4 hover:text-on-primary-container"
        >
          ¿No tienes cuenta? Regístrate
        </button>
      </form>
    </main>
  );
}
