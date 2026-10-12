import type { Request, Response } from "express";
import { cancelOrder, createOrder, getOrder, quoteOrder } from "../services/orderService.js";
import type { OrderItemInput } from "../services/orderService.js";

export async function quoteHandler(req: Request, res: Response): Promise<void> {
  const { items } = req.query as unknown as { items: OrderItemInput[] };
  const quote = await quoteOrder(items);
  res.status(200).json(quote);
}

export async function createOrderHandler(req: Request, res: Response): Promise<void> {
  const { items } = req.body as { items: OrderItemInput[] };
  const result = await createOrder(req.user!.id, items);
  res.status(201).json(result);
}

export async function getOrderHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const order = await getOrder(Number(id), req.user!);
  res.status(200).json(order);
}

export async function cancelOrderHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const order = await cancelOrder(Number(id), req.user!);
  res.status(200).json(order);
}
