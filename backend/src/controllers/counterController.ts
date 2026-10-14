import type { Request, Response } from "express";
import {
  cancelReadyOrder,
  createCounterOrder,
  deliverOrder,
  listReadyForPickup,
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

export async function readyOrdersHandler(_req: Request, res: Response): Promise<void> {
  const orders = await listReadyForPickup();
  res.status(200).json({ orders });
}

export async function deliverOrderHandler(req: Request, res: Response): Promise<void> {
  const orderId = Number(req.params.id);
  const result = await deliverOrder(orderId, req.user!.id);
  res.status(200).json({ order: result });
}

export async function cancelReadyOrderHandler(req: Request, res: Response): Promise<void> {
  const orderId = Number(req.params.id);
  const result = await cancelReadyOrder(orderId, req.user!.id);
  res.status(200).json({ order: result });
}
