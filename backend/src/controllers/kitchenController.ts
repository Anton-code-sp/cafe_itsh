import type { Request, Response } from "express";
import { getKitchenQueue, readyOrder, startOrder } from "../services/kitchenService.js";

export async function queueHandler(_req: Request, res: Response): Promise<void> {
  const orders = await getKitchenQueue();
  res.status(200).json({ orders });
}

export async function startOrderHandler(req: Request, res: Response): Promise<void> {
  const result = await startOrder(Number(req.params.id), req.user!.id);
  res.status(200).json({ order: result });
}

export async function readyOrderHandler(req: Request, res: Response): Promise<void> {
  const result = await readyOrder(Number(req.params.id), req.user!.id);
  res.status(200).json({ order: result });
}
