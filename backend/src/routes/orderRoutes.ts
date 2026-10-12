import { Router } from "express";
import {
  cancelOrderHandler,
  createOrderHandler,
  getOrderHandler,
  quoteHandler,
} from "../controllers/orderController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validations/menuSchemas.js";
import { createOrderSchema, itemsQuerySchema } from "../validations/orderSchemas.js";

export const orderRouter = Router();

orderRouter.get("/quote", authenticate, validate("query", itemsQuerySchema), quoteHandler);

orderRouter.post("/", authenticate, validate("body", createOrderSchema), createOrderHandler);

orderRouter.get("/:id", authenticate, validate("params", idParamSchema), getOrderHandler);

orderRouter.post(
  "/:id/cancel",
  authenticate,
  validate("params", idParamSchema),
  cancelOrderHandler,
);
