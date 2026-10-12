import { Router } from "express";
import { confirmPaymentHandler } from "../controllers/paymentController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { orderIdParamSchema } from "../validations/orderSchemas.js";

export const paymentRouter = Router();

paymentRouter.post(
  "/:orderId/confirm",
  authenticate,
  validate("params", orderIdParamSchema),
  confirmPaymentHandler,
);
