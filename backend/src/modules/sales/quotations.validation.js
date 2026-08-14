import { z } from "zod";

export const quotationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  salesRepId: z.string().uuid().optional(),
});

export const quotationIdSchema = z.object({
  id: z.string().uuid(),
});

export const createQuotationSchema = z.object({
  customerId: z.string().uuid(),
  salesRepId: z.string().uuid(),
  salesRequestId: z.string().uuid().optional(),
  quotationDate: z.string().datetime().or(z.coerce.date()),
  validUntil: z.string().datetime().or(z.coerce.date()),
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
