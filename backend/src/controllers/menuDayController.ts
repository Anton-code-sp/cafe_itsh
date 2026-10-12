import type { Request, Response } from "express";
import {
  getMenuDayAdmin,
  publishMenuDay,
  updateMenuDayRow,
} from "../services/menuService.js";

export async function getMenuDayHandler(req: Request, res: Response): Promise<void> {
  const { fecha } = req.query as { fecha?: string };
  const menu = await getMenuDayAdmin(fecha);
  res.status(200).json(menu);
}

export async function publishMenuDayHandler(req: Request, res: Response): Promise<void> {
  const { fecha, platilloId, precio, especial } = req.body as {
    fecha: string;
    platilloId: number;
    precio: number;
    especial?: boolean;
  };
  const row = await publishMenuDay(fecha, platilloId, precio, especial ?? false);
  res.status(201).json(row);
}

export async function updateMenuDayRowHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const changes = req.body as {
    precio?: number;
    disponible?: boolean;
    especial?: boolean;
  };
  const row = await updateMenuDayRow(id, changes);
  res.status(200).json(row);
}
