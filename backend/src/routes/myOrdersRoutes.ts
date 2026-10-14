import { Router } from "express";
import {
  getMineHandler,
  getNotificationsHandler,
  listMineHandler,
} from "../controllers/myOrdersController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validations/menuSchemas.js";

export const myOrdersRouter = Router();

myOrdersRouter.get("/", authenticate, listMineHandler);

myOrdersRouter.get("/:id", authenticate, validate("params", idParamSchema), getMineHandler);

myOrdersRouter.get(
  "/:id/notifications",
  authenticate,
  validate("params", idParamSchema),
  getNotificationsHandler,
);
