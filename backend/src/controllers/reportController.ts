import type { Request, Response } from "express";
import { getSalesReport } from "../services/reportService.js";

export async function salesReportHandler(req: Request, res: Response): Promise<void> {
  const { desde, hasta } = req.query as { desde: string; hasta: string };
  const report = await getSalesReport(desde, hasta);
  res.status(200).json(report);
}
