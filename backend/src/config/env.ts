import "dotenv/config";
import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url({ error: "DATABASE_URL debe ser una URL válida" }),
  JWT_SECRET: z.string().min(16, { error: "JWT_SECRET debe tener al menos 16 caracteres" }),
  PAYMENT_API_KEY: z.string().min(1, { error: "PAYMENT_API_KEY es requerida" }),
  NOTIFICATION_API_KEY: z.string().min(1, { error: "NOTIFICATION_API_KEY es requerida" }),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
  SEED_CAJERO_PASSWORD: z.string().min(8).optional(),
  SEED_COCINERO_PASSWORD: z.string().min(8).optional(),
  ALLOWED_EMAIL_DOMAINS: z.string().default(""),
  CUTOFF_TIME: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "CUTOFF_TIME debe tener formato HH:MM" })
    .default("13:00"),
  TZ: z.string().min(1, { error: "TZ es requerida" }).default("America/Mexico_City"),
  NOTIFY_CHANNEL: z
    .enum(["console", "smtp"], { error: "NOTIFY_CHANNEL debe ser console o smtp" })
    .default("console"),
});

export type Env = z.infer<typeof envSchema>;

export function parseAllowedDomains(raw: string): string[] {
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function emailDomainAllowed(correo: string, domains: string[]): boolean {
  if (domains.length === 0) return true;
  const domain = correo.split("@")[1]?.toLowerCase() ?? "";
  return domains.includes(domain);
}

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

export const allowedEmailDomains: string[] = parseAllowedDomains(env.ALLOWED_EMAIL_DOMAINS);

export function isAllowedEmailDomain(correo: string): boolean {
  return emailDomainAllowed(correo, allowedEmailDomains);
}
