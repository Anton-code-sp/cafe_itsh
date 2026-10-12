import { describe, expect, it } from "vitest";
import { envSchema } from "./env.js";

describe("envSchema", () => {
  const validEnv = {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/cafe",
    JWT_SECRET: "segredo-seguro-de-16-caracteres",
    PAYMENT_API_KEY: "test-key",
    NOTIFICATION_API_KEY: "test-key",
  };

  it("acepta un conjunto válido de variables", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it("aplica defaults de NODE_ENV y PORT", () => {
    const result = envSchema.parse(validEnv);
    expect(result.NODE_ENV).toBe("development");
    expect(result.PORT).toBe(3001);
  });

  it("rechaza DATABASE_URL inválida", () => {
    const result = envSchema.safeParse({ ...validEnv, DATABASE_URL: "no-es-url" });
    expect(result.success).toBe(false);
  });

  it("rechaza JWT_SECRET corto", () => {
    const result = envSchema.safeParse({ ...validEnv, JWT_SECRET: "corto" });
    expect(result.success).toBe(false);
  });
});
