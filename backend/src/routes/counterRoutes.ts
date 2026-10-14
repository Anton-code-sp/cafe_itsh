import { Router } from "express";
import {
  createCounterOrderHandler,
  deliverOrderHandler,
  readyOrdersHandler,
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
counterRouter.get("/orders/ready", readyOrdersHandler);
counterRouter.post("/orders", validate("body", createCounterOrderSchema), createCounterOrderHandler);
counterRouter.post("/orders/:id/undo", validate("params", idParamSchema), undoOrderHandler);
counterRouter.post("/orders/:id/deliver", validate("params", idParamSchema), deliverOrderHandler);
