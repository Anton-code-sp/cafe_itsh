import { Router } from "express";
import {
  createUserHandler,
  listUsersHandler,
  updateUserHandler,
} from "../controllers/userController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import {
  createOperativeSchema,
  idParamSchema,
  updateOperativeSchema,
} from "../validations/authSchemas.js";

export const userRouter = Router();

userRouter.use(authenticate, requireRole("administrador"));

userRouter.get("/", listUsersHandler);
userRouter.post("/", validate("body", createOperativeSchema), createUserHandler);
userRouter.patch(
  "/:id",
  validate("params", idParamSchema),
  validate("body", updateOperativeSchema),
  updateUserHandler,
);
