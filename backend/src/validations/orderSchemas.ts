import { z } from "zod";

const menuItemSchema = z.object({
  menuDiaId: z.coerce.number().int().positive({ error: "menuDiaId inválido" }),
  cantidad: z.coerce
    .number({ error: "La cantidad debe ser un número" })
    .int("La cantidad debe ser un número entero")
    .min(1, { error: "La cantidad debe ser al menos 1" }),
});

export const createOrderSchema = z.object({
  items: z
    .array(menuItemSchema)
    .min(1, { error: "El pedido debe incluir al menos un platillo" }),
});

export const itemsQuerySchema = z.object({
  items: z
    .string()
    .min(1, { error: "Debe indicar items en el formato menuDiaId:cantidad" })
    .transform((raw) =>
      raw.split(",").map((pair) => {
        const [idRaw, cantidadRaw] = pair.split(":");
        return {
          menuDiaId: Number(idRaw),
          cantidad: Number(cantidadRaw),
        };
      }),
    )
    .refine(
      (items) =>
        items.every(
          (i) =>
            Number.isInteger(i.menuDiaId) &&
            i.menuDiaId > 0 &&
            Number.isInteger(i.cantidad) &&
            i.cantidad >= 1,
        ),
      { error: "Formato de items inválido (usa menuDiaId:cantidad separados por coma)" },
    ),
});

export const orderIdParamSchema = z.object({
  orderId: z.coerce.number().int().positive({ error: "Id de pedido inválido" }),
});

export const createCounterOrderSchema = z.object({
  clienteNombre: z
    .string()
    .trim()
    .min(1, { error: "El nombre del cliente no puede estar vacío" })
    .max(100, { error: "El nombre del cliente no puede exceder 100 caracteres" })
    .optional(),
  items: z
    .array(menuItemSchema)
    .min(1, { error: "El pedido debe incluir al menos un platillo" }),
  montoRecibido: z.coerce
    .number({ error: "El monto recibido debe ser un número" })
    .positive({ error: "El monto recibido debe ser mayor a 0" }),
});
