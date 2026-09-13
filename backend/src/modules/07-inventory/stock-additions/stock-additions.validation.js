import { z } from 'zod';

export const createStockAdditionSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  addedQuantity: z.coerce.number().positive({ message: 'Added quantity must be greater than 0' }),
  notes: z.string().max(1000).optional(),
  referenceType: z.string().max(100).optional(),
  referenceId: z.string().uuid().optional(),
  addedAt: z.coerce.date().optional(),
});

export const updateStockAdditionSchema = z.object({
  addedQuantity: z.coerce.number().positive({ message: 'Added quantity must be greater than 0' }).optional(),
  notes: z.string().max(1000).nullable().optional(),
  referenceType: z.string().max(100).nullable().optional(),
  referenceId: z.string().uuid().nullable().optional(),
});

export const stockAdditionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  warehouseStockId: z.string().uuid().optional(),
  referenceType: z.string().optional(),
  search: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const stockAdditionIdSchema = z.object({
  id: z.string().uuid(),
});
