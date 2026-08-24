import { z } from "zod";

export const salesRequestQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  salesRepId: z.string().uuid().optional(),
  source: z.enum(["CUSTOMER_PORTAL", "SALES_OFFICER"]).optional(),
});

export const salesRequestIdSchema = z.object({
  id: z.string().uuid(),
});

export const createSalesRequestSchema = z.object({
  customerId: z.string().uuid(),
  salesRepId: z.string().uuid().optional(),
  source: z.enum(["CUSTOMER_PORTAL", "SALES_OFFICER"]),
  subject: z.string().min(1).max(255),
  message: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.coerce.number().positive(),
      notes: z.string().optional(),
    })
  ).min(1),
});
