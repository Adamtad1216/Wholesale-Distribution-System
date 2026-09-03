import { z } from 'zod';

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  productId: z.string().uuid('Invalid product ID format').optional(),
  categoryId: z.string().uuid('Invalid category ID format').optional(),
  brandId: z.string().uuid('Invalid brand ID format').optional(),
  unitId: z.string().uuid('Invalid unit ID format').optional(),
  warehouseId: z.string().uuid('Invalid warehouse ID format').optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
});

export const productIdSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

const createWarehouseSellingPriceItemSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID format'),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative'),
  wholesalePrice: z.coerce.number().min(0, 'Wholesale price cannot be negative'),
});

const updateWarehouseSellingPriceItemSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID format'),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative'),
  wholesalePrice: z.coerce.number().min(0, 'Wholesale price cannot be negative'),
  status: z.string().optional(),
});

export const createProductSchema = z.object({
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(1, 'Product name is required').max(255),
  categoryId: z.string().uuid('Invalid category ID format'),
  brandId: z.string().uuid('Invalid brand ID format').optional().nullable(),
  unitId: z.string().uuid('Invalid unit ID format'),
  images: z
    .array(
      z.object({
        imageUrl: z.string().url('Invalid image URL format'),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),
  warehouseSellingPrices: z.array(createWarehouseSellingPriceItemSchema).optional(),
});

export const updateProductSchema = z.object({
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255).optional(),
  categoryId: z.string().uuid('Invalid category ID format').optional(),
  brandId: z.string().uuid('Invalid brand ID format').optional().nullable(),
  unitId: z.string().uuid('Invalid unit ID format').optional(),
  status: z.string().optional(),
  warehouseSellingPrices: z.array(updateWarehouseSellingPriceItemSchema).optional(),
});

export const productImageSchema = z.object({
  imageUrl: z.string().url('Invalid image URL format'),
  isPrimary: z.boolean().default(false),
});
