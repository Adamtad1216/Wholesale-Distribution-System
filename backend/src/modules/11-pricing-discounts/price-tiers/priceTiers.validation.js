import { z } from "zod";

export const priceTierQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
  isDefault: z.coerce.boolean().optional(),
});

export const priceTierIdSchema = z.object({
  id: z.string().uuid(),
});

const nameField = z.string().trim().min(1).max(80);

export const createPriceTierSchema = z.object({
  name: nameField,
  description: z.string().trim().max(500).optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  priority: z.number().int().optional().default(0),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional().default("ACTIVE"),
});

export const updatePriceTierSchema = z
  .object({
    name: nameField.optional(),
    description: z.string().trim().max(500).optional().nullable(),
    isDefault: z.boolean().optional(),
    priority: z.number().int().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field is required" });

export const setPriceTierStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT", "EXPIRED"]),
});