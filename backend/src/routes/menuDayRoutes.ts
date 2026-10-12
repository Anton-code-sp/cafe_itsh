import { Router } from "express";
import {
  getMenuDayHandler,
  publishMenuDayHandler,
  updateMenuDayRowHandler,
} from "../controllers/menuDayController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import {
  fechaQuerySchema,
  idParamSchema,
  publishMenuDaySchema,
  updateMenuDayRowSchema,
} from "../validations/menuSchemas.js";

export const menuDayRouter = Router();

menuDayRouter.use(authenticate, requireRole("administrador"));

menuDayRouter.get("/", validate("query", fechaQuerySchema), getMenuDayHandler);
menuDayRouter.post("/", validate("body", publishMenuDaySchema), publishMenuDayHandler);
menuDayRouter.patch(
  "/:id",
  validate("params", idParamSchema),
  validate("body", updateMenuDayRowSchema),
  updateMenuDayRowHandler,
);
