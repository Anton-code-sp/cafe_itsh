import "dotenv/config";
import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url({ error: "DATABASE_URL debe ser una URL válida" }),
  JWT_SECRET: z.string().min(16, { error: "JWT_SECRET debe tener al menos 16 caracteres" }),
  PAYMENT_API_KEY: z.string().min(1, { error: "PAYMENT_API_KEY es requerida" }),
  NOTIFICATION_API_KEY: z.string().min(1, { error: "NOTIFICATION_API_KEY es requerida" }),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.error("Variables de entorno inválidas:\n" + issues);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
