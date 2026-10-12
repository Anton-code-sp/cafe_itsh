import type { Request, Response } from "express";
import { confirmPayment } from "../services/paymentService.js";

export async function confirmPaymentHandler(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params as { orderId: string };
  const result = await confirmPayment(Number(orderId));
  res.status(200).json(result);
}
