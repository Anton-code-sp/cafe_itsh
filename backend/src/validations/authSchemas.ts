import { z } from "zod";

export const loginSchema = z.object({
  correo: z.email({ error: "Correo inválido" }),
  password: z.string().min(1, { error: "La contraseña es requerida" }),
});

export const registerSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { error: "El nombre debe tener al menos 2 caracteres" })
    .max(100, { error: "El nombre no puede exceder 100 caracteres" }),
  correo: z.email({ error: "Correo inválido" }),
  password: z
    .string()
    .min(8, { error: "La contraseña debe tener al menos 8 caracteres" })
    .max(100, { error: "La contraseña no puede exceder 100 caracteres" }),
});

export const createOperativeSchema = registerSchema.extend({
  rol: z.enum(["administrador", "cajero", "cocinero"], {
    error: "El rol debe ser administrador, cajero o cocinero",
  }),
});

export const updateOperativeSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, { error: "El nombre debe tener al menos 2 caracteres" })
      .max(100)
      .optional(),
    correo: z.email({ error: "Correo inválido" }).optional(),
    activo: z.boolean().optional(),
    rol: z
      .enum(["administrador", "cajero", "cocinero"], {
        error: "El rol debe ser administrador, cajero o cocinero",
      })
      .optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    error: "Debe indicar al menos un campo a actualizar",
  });

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive({ error: "Id inválido" }),
});
