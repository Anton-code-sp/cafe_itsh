import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { authenticate } from "./authenticate.js";
import { env } from "../config/env.js";
import { ApiError } from "../errors.js";

function runMiddleware(header?: string) {
  const req = { headers: header ? { authorization: header } : {} } as unknown as Request;
  const res = {} as Response;
  let error: unknown;
  let called = false;
  authenticate(req, res, ((err?: unknown) => {
    called = true;
    error = err;
  }) as NextFunction);
  return { req, error, called };
}

describe("authenticate", () => {
  it("sin token → 401", () => {
    const { error } = runMiddleware();
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
  });

  it("token inválido → 401", () => {
    const { error } = runMiddleware("Bearer no-es-un-token");
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
  });

  it("token válido → next sin error y req.user poblado", () => {
    const token = jwt.sign({ sub: 1, rol: "administrador", nombre: "Admin" }, env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const { req, error, called } = runMiddleware(`Bearer ${token}`);
    expect(called).toBe(true);
    expect(error).toBeUndefined();
    expect(req.user).toEqual({ id: 1, rol: "administrador", nombre: "Admin" });
  });

  it("header sin prefijo Bearer → 401", () => {
    const { error } = runMiddleware("Token abc");
    expect((error as ApiError).status).toBe(401);
  });
});
