import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

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
        <h2 className="mb-2 font-display text-headline-md text-status-delivered">
          Cuenta creada
        </h2>
        <p className="mb-6 text-sm text-on-surface-variant">
          Ya puedes iniciar sesión con tu correo y contraseña.
        </p>
        <Button type="button" onClick={onRegistered} className="w-full">
          Ir a inicio de sesión
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-4 font-display text-headline-md text-on-surface">
        Registro de alumno/docente
      </h2>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-error-container p-3 text-sm text-on-error-container"
        >
          {error}
        </p>
      )}

      <Label className="mb-1 block" htmlFor="reg-nombre">
        Nombre
      </Label>
      <Input
        id="reg-nombre"
        required
        minLength={2}
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="mb-4"
      />

      <Label className="mb-1 block" htmlFor="reg-correo">
        Correo institucional
      </Label>
      <Input
        id="reg-correo"
        type="email"
        required
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        className="mb-4"
      />

      <Label className="mb-1 block" htmlFor="reg-password">
        Contraseña (mínimo 8 caracteres)
      </Label>
      <Input
        id="reg-password"
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-6"
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creando…" : "Crear cuenta"}
      </Button>

      <button
        type="button"
        onClick={onRegistered}
        className="mt-4 h-11 w-full text-sm text-primary underline underline-offset-4 hover:text-on-primary-container"
      >
        ¿Ya tienes cuenta? Inicia sesión
      </button>
    </form>
  );
}
