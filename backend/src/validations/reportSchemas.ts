import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Debe ser una fecha YYYY-MM-DD" });

export const salesQuerySchema = z.object({
  desde: isoDate,
  hasta: isoDate,
});
