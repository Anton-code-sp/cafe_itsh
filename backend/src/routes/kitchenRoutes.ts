import { Router } from "express";
import {
  queueHandler,
  readyOrderHandler,
  startOrderHandler,
} from "../controllers/kitchenController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validations/menuSchemas.js";

export const kitchenRouter = Router();

kitchenRouter.use(authenticate, requireRole("cocinero"));

kitchenRouter.get("/orders", queueHandler);
kitchenRouter.post("/orders/:id/start", validate("params", idParamSchema), startOrderHandler);
kitchenRouter.post("/orders/:id/ready", validate("params", idParamSchema), readyOrderHandler);
