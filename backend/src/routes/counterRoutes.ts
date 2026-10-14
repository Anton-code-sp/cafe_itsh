import { Router } from "express";
import {
  createCounterOrderHandler,
  recentOrdersHandler,
  undoOrderHandler,
} from "../controllers/counterController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validations/menuSchemas.js";
import { createCounterOrderSchema } from "../validations/orderSchemas.js";

export const counterRouter = Router();

counterRouter.use(authenticate, requireRole("cajero"));

counterRouter.get("/orders/recent", recentOrdersHandler);
counterRouter.post("/orders", validate("body", createCounterOrderSchema), createCounterOrderHandler);
counterRouter.post("/orders/:id/undo", validate("params", idParamSchema), undoOrderHandler);
