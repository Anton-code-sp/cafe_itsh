import { describe, expect, it } from "vitest";
import { emailDomainAllowed, envSchema, parseAllowedDomains } from "./env.js";

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

  it("acepta variables de seed y dominios opcionales", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      SEED_ADMIN_PASSWORD: "password-de-ejemplo",
      ALLOWED_EMAIL_DOMAINS: "itsx.mx, its.edu.mx",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza SEED_ADMIN_PASSWORD corta", () => {
    const result = envSchema.safeParse({ ...validEnv, SEED_ADMIN_PASSWORD: "corto" });
    expect(result.success).toBe(false);
  });

  it("aplica defaults de CUTOFF_TIME y TZ", () => {
    const result = envSchema.parse(validEnv);
    expect(result.CUTOFF_TIME).toBe("13:00");
    expect(result.TZ).toBe("America/Mexico_City");
  });

  it("acepta CUTOFF_TIME válida", () => {
    const result = envSchema.safeParse({ ...validEnv, CUTOFF_TIME: "12:45" });
    expect(result.success).toBe(true);
  });

  it("rechaza CUTOFF_TIME con formato inválido", () => {
    expect(envSchema.safeParse({ ...validEnv, CUTOFF_TIME: "25:00" }).success).toBe(false);
    expect(envSchema.safeParse({ ...validEnv, CUTOFF_TIME: "13" }).success).toBe(false);
    expect(envSchema.safeParse({ ...validEnv, CUTOFF_TIME: "13:60" }).success).toBe(false);
  });
});

describe("parseAllowedDomains / emailDomainAllowed", () => {
  it("parsea lista con espacios y la normaliza", () => {
    expect(parseAllowedDomains(" ITSX.mx , its.edu.mx ")).toEqual(["itsx.mx", "its.edu.mx"]);
  });

  it("lista vacía acepta cualquier correo (modo desarrollo)", () => {
    expect(emailDomainAllowed("cualquiera@test.com", [])).toBe(true);
  });

  it("dominio permitido → ok; no permitido → rechazo", () => {
    const domains = ["itsx.mx"];
    expect(emailDomainAllowed("alumno@itsx.mx", domains)).toBe(true);
    expect(emailDomainAllowed("alumno@GMAIL.com".toLowerCase(), domains)).toBe(false);
    expect(emailDomainAllowed("sin-dominio", domains)).toBe(false);
  });

  it("es case-insensitive", () => {
    expect(emailDomainAllowed("ana@ITSX.MX", ["itsx.mx"])).toBe(true);
  });
});
