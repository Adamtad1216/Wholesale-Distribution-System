import { z } from "zod";

const uuid = z.string().uuid();

export const discountRuleQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
  productId: uuid.optional(),
  priceTierId: uuid.optional(),
  warehouseId: uuid.optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
});

export const discountRuleIdSchema = z.object({ id: uuid });

export const createDiscountRuleSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    productId: uuid.optional().nullable(),
    priceTierId: uuid.optional().nullable(),
    warehouseId: uuid.optional().nullable(),
    minQuantity: z.coerce.number().nonnegative().optional().nullable(),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    discountValue: z.coerce.number().positive(),
    priority: z.coerce.number().int().optional().default(0),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional().default("ACTIVE"),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
  })
  .refine((v) => v.discountType !== "PERCENTAGE" || v.discountValue <= 100, {
    message: "Percentage discount value must be <= 100",
    path: ["discountValue"],
  })
  .refine((v) => !v.endsAt || !v.startsAt || v.endsAt >= v.startsAt, {
    message: "endsAt must be greater than or equal to startsAt",
    path: ["endsAt"],
  });

export const updateDiscountRuleSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    productId: uuid.optional().nullable(),
    priceTierId: uuid.optional().nullable(),
    warehouseId: uuid.optional().nullable(),
    minQuantity: z.coerce.number().nonnegative().optional().nullable(),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
    discountValue: z.coerce.number().positive().optional(),
    priority: z.coerce.number().int().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field is required" });