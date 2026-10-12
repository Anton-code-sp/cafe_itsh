import { describe, expect, it } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requireRole } from "./requireRole.js";
import { ApiError } from "../errors.js";

function run(rol?: string, ...roles: string[]) {
  const req = { user: rol ? { id: 1, rol, nombre: "Test" } : undefined } as Request;
  const res = {} as Response;
  let error: unknown;
  requireRole(...roles)(req, res, ((err?: unknown) => {
    error = err;
  }) as NextFunction);
  return { error };
}

describe("requireRole", () => {
  it("rol correcto → next sin error", () => {
    expect(run("administrador", "administrador").error).toBeUndefined();
  });

  it("rol incorrecto → 403", () => {
    const { error } = run("cocinero", "administrador");
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(403);
  });

  it("sin usuario en request → 401", () => {
    const { error } = run(undefined, "administrador");
    expect((error as ApiError).status).toBe(401);
  });

  it("acepta cualquiera de los roles listados", () => {
    expect(run("cajero", "administrador", "cajero").error).toBeUndefined();
  });
});
