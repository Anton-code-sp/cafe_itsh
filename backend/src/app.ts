import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/health", healthRouter);

  app.use(errorHandler);

  return app;
}
