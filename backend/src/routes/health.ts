import { Router } from "express";
import { healthCheck } from "../controllers/health.js";

export const healthRouter = Router();

healthRouter.get("/", healthCheck);
