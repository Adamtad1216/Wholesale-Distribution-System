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

export const createSalesOrderSchema = z.object({
  customerId: z.string().uuid(),
  salesRepId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quotationId: z.string().uuid().optional(),
  orderDate: z.string().datetime().or(z.coerce.date()),
  requiredDate: z.string().datetime().or(z.coerce.date()).optional(),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.coerce.number().positive(),
      unitPrice: z.coerce.number().nonnegative(),
      discount: z.coerce.number().min(0).default(0),
      tax: z.coerce.number().min(0).default(0),
    })
  ).min(1),
});
