import { z } from "zod";

const uuid = z.string().uuid();

export const salesQuotaQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
  customerId: uuid.optional(),
  productId: uuid.optional(),
  priceTierId: uuid.optional(),
  warehouseId: uuid.optional(),
  branchId: uuid.optional(),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
});

export const salesQuotaIdSchema = z.object({ id: uuid });

export const createSalesQuotaSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    customerId: uuid.optional().nullable(),
    productId: uuid.optional().nullable(),
    priceTierId: uuid.optional().nullable(),
    warehouseId: uuid.optional().nullable(),
    branchId: uuid.optional().nullable(),
    maxQuantity: z.coerce.number().positive(),
    period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional().default("MONTHLY"),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional().default("ACTIVE"),
  })
  .refine((v) => v.endsAt >= v.startsAt, {
    message: "endsAt must be greater than or equal to startsAt",
    path: ["endsAt"],
  })
  .refine(
    (v) =>
      v.customerId ||
      v.productId ||
      v.priceTierId ||
      v.warehouseId ||
      v.branchId,
    {
      message:
        "A quota must scope at least one of: customer, product, price tier, warehouse, or branch.",
      path: ["customerId"],
    },
  );

export const updateSalesQuotaSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    customerId: uuid.optional().nullable(),
    productId: uuid.optional().nullable(),
    priceTierId: uuid.optional().nullable(),
    warehouseId: uuid.optional().nullable(),
    branchId: uuid.optional().nullable(),
    maxQuantity: z.coerce.number().positive().optional(),
    period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field is required" });