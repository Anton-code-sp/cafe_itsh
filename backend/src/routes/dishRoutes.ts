import { Router } from "express";
import {
  createDishHandler,
  listDishesHandler,
  updateDishHandler,
} from "../controllers/dishController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import { createDishSchema, idParamSchema, updateDishSchema } from "../validations/menuSchemas.js";

export const dishRouter = Router();

dishRouter.use(authenticate, requireRole("administrador"));

dishRouter.get("/", listDishesHandler);
dishRouter.post("/", validate("body", createDishSchema), createDishHandler);
dishRouter.patch(
  "/:id",
  validate("params", idParamSchema),
  validate("body", updateDishSchema),
  updateDishHandler,
);
