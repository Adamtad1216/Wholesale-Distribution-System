import { z } from 'zod';

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
});

export const productIdSchema = z.object({
  id: z.string().uuid(),
});

export const createProductSchema = z.object({
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid(),
  unitId: z.string().uuid(),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().min(0),
  minimumStockLevel: z.coerce.number().min(0).default(0),
  reorderLevel: z.coerce.number().min(0).default(0),
  images: z.array(
    z.object({
      imageUrl: z.string().url(),
      isPrimary: z.boolean().default(false),
    })
  ).optional(),
});

export const updateProductSchema = z.object({
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255).optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
  wholesalePrice: z.coerce.number().min(0).optional(),
  minimumStockLevel: z.coerce.number().min(0).optional(),
  reorderLevel: z.coerce.number().min(0).optional(),
});

export const productImageSchema = z.object({
  imageUrl: z.string().url(),
  isPrimary: z.boolean().default(false),
});

export const priceTierSchema = z.object({
  minQuantity: z.coerce.number().min(0),
  maxQuantity: z.coerce.number().min(0).optional(),
  unitPrice: z.coerce.number().min(0),
});

export const discountRuleSchema = z.object({
  name: z.string().min(1).max(100),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.coerce.number().min(0),
  minQuantity: z.coerce.number().min(0),
  maxQuantity: z.coerce.number().min(0).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  status: z.string().default('ACTIVE'),
});
