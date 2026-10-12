import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { unauthorized } from "../errors.js";
import type { AuthUser } from "../types/auth.js";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next(unauthorized("Se requiere iniciar sesión"));
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    const user: AuthUser = {
      id: Number(payload.sub),
      rol: String(payload.rol),
      nombre: String(payload.nombre ?? ""),
    };
    if (!Number.isInteger(user.id) || !user.rol) {
      next(unauthorized("Token inválido"));
      return;
    }
    req.user = user;
    next();
  } catch {
    next(unauthorized("Token inválido o expirado"));
  }
}
