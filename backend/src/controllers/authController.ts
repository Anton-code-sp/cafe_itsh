import type { Request, Response } from "express";
import { login } from "../services/authService.js";
import { isAllowedEmailDomain } from "../config/env.js";
import { registerClient } from "../services/userService.js";
import { badRequest } from "../errors.js";

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { correo, password } = req.body as { correo: string; password: string };
  const result = await login(correo, password);
  res.status(200).json(result);
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const { nombre, correo, password } = req.body as {
    nombre: string;
    correo: string;
    password: string;
  };

  if (!isAllowedEmailDomain(correo)) {
    throw badRequest("Solo se permiten correos institucionales");
  }

  const user = await registerClient(nombre, correo, password);
  res.status(201).json(user);
}
