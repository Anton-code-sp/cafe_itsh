import type { NextFunction, Request, Response } from "express";
import { forbidden, unauthorized } from "../errors.js";

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(unauthorized("Se requiere iniciar sesión"));
      return;
    }
    if (!roles.includes(req.user.rol)) {
      next(forbidden("No tienes permiso para esta operación"));
      return;
    }
    next();
  };
}
