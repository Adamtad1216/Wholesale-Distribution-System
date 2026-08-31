import { z } from 'zod';

export const adjustmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  warehouseId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

export const adjustmentIdSchema = z.object({
  id: z.string().uuid(),
});

export const createAdjustmentSchema = z.object({
  warehouseId: z.string().uuid(),
  reason: z.string().min(1).max(500),
  items: z.array(z.object({
    productId: z.string().uuid(),
    actualQuantity: z.coerce.number().min(0),
    reason: z.string().optional(),
  })).min(1),
});

export const updateAdjustmentSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    actualQuantity: z.coerce.number().min(0),
    reason: z.string().optional(),
  })).min(1).optional(),
});

export const approveAdjustmentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const createAdjustmentItemSchema = z.object({
  productId: z.string().uuid(),
  actualQuantity: z.coerce.number().min(0),
  reason: z.string().optional(),
});

export const updateAdjustmentItemSchema = z.object({
  actualQuantity: z.coerce.number().min(0).optional(),
  reason: z.string().optional(),
});
