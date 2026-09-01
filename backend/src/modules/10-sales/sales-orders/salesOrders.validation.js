import { z } from "zod";

export const salesOrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  salesRepId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
});

export const salesOrderIdSchema = z.object({
  id: z.string().uuid(),
});

export const previewSalesOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().positive().finite().max(999999999999),
      })
    )
    .min(1),
});

export const createSalesOrderSchema = z.object({
  warehouseId: z.string().uuid(),
  requiredDate: z.string().datetime().or(z.coerce.date()).optional(),
  deliveryLocation: z
    .object({
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
      addressText: z.string().optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().positive().finite().max(999999999999),
      })
    )
    .min(1),
});