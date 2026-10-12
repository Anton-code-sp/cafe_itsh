import type { Request, Response } from "express";
import { getMenuByDate } from "../services/menuService.js";

export async function getMenuHandler(req: Request, res: Response): Promise<void> {
  const { fecha } = req.query as { fecha?: string };
  const menu = await getMenuByDate(fecha);
  res.status(200).json(menu);
}
