import { z } from "zod";

const uuid = z.string().uuid();

export const productPriceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
  productId: uuid.optional(),
  priceTierId: uuid.optional(),
  warehouseId: uuid.optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
});

export const productPriceIdSchema = z.object({ id: uuid });

export const createProductPriceSchema = z
  .object({
    productId: uuid,
    priceTierId: uuid,
    warehouseId: uuid.optional().nullable(),
    unitPrice: z.coerce.number().nonnegative(),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional().default("ACTIVE"),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
  })
  .refine((v) => !v.endsAt || !v.startsAt || v.endsAt >= v.startsAt, {
    message: "endsAt must be greater than or equal to startsAt",
    path: ["endsAt"],
  });

export const createBatchProductPricesSchema = z.object({
  priceTierId: uuid,
  warehouseId: uuid.optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional().default("ACTIVE"),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: uuid,
        unitPrice: z.coerce.number().positive("Unit price must be greater than 0"),
      }),
    )
    .min(1, "At least one product rate is required"),
});

export const updateProductPriceSchema = z
  .object({
    warehouseId: uuid.optional().nullable(),
    unitPrice: z.coerce.number().nonnegative().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field is required" });