import { z } from 'zod';

export const stockQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  lowStock: z.coerce.boolean().optional(),
});

export const stockIdSchema = z.object({
  id: z.string().uuid(),
});

export const createStockSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  // Optional initial quantity — creates the first ProductAddedQuantity record if > 0
  quantity: z.coerce.number().min(0).default(0),
  minimumStock: z.coerce.number().min(0).default(0),
  reorderLevel: z.coerce.number().min(0).default(0),
  notes: z.string().max(1000).optional(),
});

export const updateStockSchema = z.object({
  // quantity is no longer a direct column — use stock-additions endpoint to add stock
  minimumStock: z.coerce.number().min(0).optional(),
  reorderLevel: z.coerce.number().min(0).optional(),
});
