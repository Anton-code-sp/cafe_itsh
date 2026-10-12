import { z } from "zod";

const fechaSchema = z.iso.date({ error: "Fecha inválida (formato YYYY-MM-DD)" });

const precioSchema = z.coerce
  .number({ error: "El precio debe ser un número" })
  .min(0, { error: "El precio no puede ser negativo" });

export const createDishSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { error: "El nombre debe tener al menos 2 caracteres" })
    .max(100, { error: "El nombre no puede exceder 100 caracteres" }),
  categoria: z
    .string()
    .trim()
    .max(50, { error: "La categoría no puede exceder 50 caracteres" })
    .optional(),
  descripcion: z.string().trim().max(500, { error: "La descripción es demasiado larga" }).optional(),
});

export const updateDishSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, { error: "El nombre debe tener al menos 2 caracteres" })
      .max(100, { error: "El nombre no puede exceder 100 caracteres" })
      .optional(),
    categoria: z
      .string()
      .trim()
      .max(50, { error: "La categoría no puede exceder 50 caracteres" })
      .optional(),
    descripcion: z
      .string()
      .trim()
      .max(500, { error: "La descripción es demasiado larga" })
      .optional(),
    activo: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    error: "Debe indicar al menos un campo a actualizar",
  });

export const publishMenuDaySchema = z.object({
  fecha: fechaSchema,
  platilloId: z.coerce.number().int().positive({ error: "platilloId inválido" }),
  precio: precioSchema,
  especial: z.boolean().default(false),
});

export const updateMenuDayRowSchema = z
  .object({
    precio: precioSchema.optional(),
    disponible: z.boolean().optional(),
    especial: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    error: "Debe indicar al menos un campo a actualizar",
  });

export const fechaQuerySchema = z.object({
  fecha: fechaSchema.optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive({ error: "Id inválido" }),
});
