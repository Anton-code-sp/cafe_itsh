import { Router } from "express";
import { loginHandler, registerHandler } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../validations/authSchemas.js";

export const authRouter = Router();

authRouter.post("/login", validate("body", loginSchema), loginHandler);
authRouter.post("/register", validate("body", registerSchema), registerHandler);
