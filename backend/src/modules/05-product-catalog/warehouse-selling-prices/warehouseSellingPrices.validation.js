import { z } from 'zod';

export const warehouseSellingPriceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  productId: z.string().uuid('Invalid product ID format').optional(),
  warehouseId: z.string().uuid('Invalid warehouse ID format').optional(),
  status: z.string().optional(),
});

export const productIdParamSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
});

export const getWarehousePriceByProductQuerySchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID format').optional(),
});

export const createWarehouseSellingPriceSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  warehouseId: z.string().uuid('Invalid warehouse ID format'),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative'),
  wholesalePrice: z.coerce.number().min(0, 'Wholesale price cannot be negative'),
});

export const updateWarehouseSellingPriceSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID format').optional(),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative').optional(),
  wholesalePrice: z.coerce.number().min(0, 'Wholesale price cannot be negative').optional(),
  status: z.string().optional(),
});
