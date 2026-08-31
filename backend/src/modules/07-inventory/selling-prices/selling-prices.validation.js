import { z } from 'zod';

export const sellingPriceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const sellingPriceIdSchema = z.object({
  id: z.string().uuid(),
});

export const createSellingPriceSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  sellingPrice: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().min(0),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateSellingPriceSchema = z.object({
  sellingPrice: z.coerce.number().min(0).optional(),
  wholesalePrice: z.coerce.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
