import { Router } from "express";
import { salesReportHandler } from "../controllers/reportController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import { salesQuerySchema } from "../validations/reportSchemas.js";

export const reportRouter = Router();

reportRouter.use(authenticate, requireRole("administrador"));

reportRouter.get(
  "/sales",
  validate("query", salesQuerySchema),
  salesReportHandler,
);
