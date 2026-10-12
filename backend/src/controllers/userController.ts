import type { Request, Response } from "express";
import { createOperative, listOperatives, updateOperative } from "../services/userService.js";

export async function listUsersHandler(_req: Request, res: Response): Promise<void> {
  const users = await listOperatives();
  res.status(200).json({ users });
}

export async function createUserHandler(req: Request, res: Response): Promise<void> {
  const { nombre, correo, password, rol } = req.body as {
    nombre: string;
    correo: string;
    password: string;
    rol: string;
  };
  const user = await createOperative(nombre, correo, password, rol);
  res.status(201).json(user);
}

export async function updateUserHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const changes = req.body as {
    nombre?: string;
    correo?: string;
    activo?: boolean;
    rol?: string;
  };
  const user = await updateOperative(id, changes);
  res.status(200).json(user);
}
