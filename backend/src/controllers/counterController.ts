import type { Request, Response } from "express";
import {
  createCounterOrder,
  listRecentCounterOrders,
  undoCounterOrder,
} from "../services/orderService.js";
import type { OrderItemInput } from "../services/orderService.js";

export async function createCounterOrderHandler(req: Request, res: Response): Promise<void> {
  const { clienteNombre, items, montoRecibido } = req.body as {
    clienteNombre?: string;
    items: OrderItemInput[];
    montoRecibido: number;
  };
  const result = await createCounterOrder(req.user!.id, items, montoRecibido, clienteNombre);
  res.status(201).json(result);
}

export async function recentOrdersHandler(_req: Request, res: Response): Promise<void> {
  const orders = await listRecentCounterOrders();
  res.status(200).json({ orders });
}

export async function undoOrderHandler(req: Request, res: Response): Promise<void> {
  const orderId = Number(req.params.id);
  const result = await undoCounterOrder(orderId, req.user!.id);
  res.status(200).json(result);
}
