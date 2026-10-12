import { createContext, useContext } from "react";
import type { SessionUser } from "./api";

export interface AuthContextValue {
  user: SessionUser | null;
  login: (correo: string, password: string) => Promise<SessionUser>;
  logout: () => void;
  homePath: (rol: string) => string;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
