import type { Request, Response } from "express";
import { createDish, listDishes, updateDish } from "../services/dishService.js";

export async function listDishesHandler(_req: Request, res: Response): Promise<void> {
  const dishes = await listDishes();
  res.status(200).json({ dishes });
}

export async function createDishHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    nombre: string;
    categoria?: string;
    descripcion?: string;
  };
  const dish = await createDish(body);
  res.status(201).json(dish);
}

export async function updateDishHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const changes = req.body as {
    nombre?: string;
    categoria?: string;
    descripcion?: string;
    activo?: boolean;
  };
  const dish = await updateDish(id, changes);
  res.status(200).json(dish);
}
