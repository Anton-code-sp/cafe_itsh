import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "query" | "params";

export function validate(part: RequestPart, schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `${issue.path.join(".") || part}: ${issue.message}`)
        .join("; ");
      res.status(400).json({ error: `Datos inválidos — ${issues}` });
      return;
    }

    Object.assign(req, { [part]: result.data });
    next();
  };
}
