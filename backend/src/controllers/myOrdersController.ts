import type { Request, Response } from "express";
import {
  getMine,
  getNotificationsForOrder,
  listMine,
} from "../services/myOrdersService.js";

export async function listMineHandler(req: Request, res: Response): Promise<void> {
  const result = await listMine(req.user!.id);
  res.status(200).json(result);
}

export async function getMineHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await getMine(Number(id), req.user!.id);
  res.status(200).json(result);
}

export async function getNotificationsHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await getNotificationsForOrder(Number(id), req.user!.id);
  res.status(200).json(result);
}
