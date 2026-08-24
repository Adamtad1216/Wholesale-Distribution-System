import { z } from "zod";

export const salesReturnQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  salesOrderId: z.string().uuid().optional(),
});

export const salesReturnIdSchema = z.object({
  id: z.string().uuid(),
});

export const createSalesReturnSchema = z.object({
  salesOrderId: z.string().uuid(),
  customerId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  reason: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.coerce.number().positive(),
      unitPrice: z.coerce.number().nonnegative(),
      condition: z.string().optional(),
      reason: z.string().optional(),
    })
  ).min(1),
});
