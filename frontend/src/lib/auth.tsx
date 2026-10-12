import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, clearSession, getStoredUser, setSession } from "./api";
import type { SessionUser } from "./api";
import { AuthContext } from "./auth-context";
import { homePathForRol } from "./paths";

interface LoginResponse {
  token: string;
  user: SessionUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => getStoredUser());

  const login = useCallback(async (correo: string, password: string) => {
    const result = await api<LoginResponse>("/auth/login", {
      method: "POST",
      body: { correo, password },
    });
    setSession(result.token, result.user);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, homePath: homePathForRol }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
