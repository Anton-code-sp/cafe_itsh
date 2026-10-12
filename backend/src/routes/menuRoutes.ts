import { Router } from "express";
import { getMenuHandler } from "../controllers/menuController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { fechaQuerySchema } from "../validations/menuSchemas.js";

export const menuRouter = Router();

menuRouter.get("/", authenticate, validate("query", fechaQuerySchema), getMenuHandler);
