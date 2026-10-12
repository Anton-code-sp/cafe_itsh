import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/authRoutes.js";
import { userRouter } from "./routes/userRoutes.js";
import { menuRouter } from "./routes/menuRoutes.js";
import { dishRouter } from "./routes/dishRoutes.js";
import { menuDayRouter } from "./routes/menuDayRoutes.js";
import { orderRouter } from "./routes/orderRoutes.js";
import { paymentRouter } from "./routes/paymentRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/menu", menuRouter);
  app.use("/api/dishes", dishRouter);
  app.use("/api/admin/menu-day", menuDayRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/payments", paymentRouter);

  app.use(errorHandler);

  return app;
}
