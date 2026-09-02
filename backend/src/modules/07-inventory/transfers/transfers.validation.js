import { z } from 'zod';

export const TRANSFER_REASONS = [
  'REBALANCING',
  'RESTOCKING',
  'DAMAGED_GOODS',
  'STORE_REQUEST',
  'SEASONAL_ALLOCATION',
  'EXCESS_STOCK',
  'OTHER',
];

export const transferQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  warehouseId: z.string().uuid().optional(),
  fromWarehouseId: z.string().uuid().optional(),
  toWarehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  transferReason: z.enum(TRANSFER_REASONS).optional(),
});

export const transferIdSchema = z.object({
  id: z.string().uuid(),
});

export const transferDetailsQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
});

export const createTransferSchema = z
  .object({
    fromWarehouseId: z.string().uuid({ message: 'fromWarehouseId must be a valid UUID' }),
    toWarehouseId: z.string().uuid({ message: 'toWarehouseId must be a valid UUID' }),
    productId: z.string().uuid({ message: 'productId must be a valid UUID' }),
    transferReason: z.enum(TRANSFER_REASONS, {
      errorMap: () => ({ message: `transferReason must be one of: ${TRANSFER_REASONS.join(', ')}` }),
    }),
    quantity: z.coerce
      .number({ invalid_type_error: 'quantity must be a number' })
      .positive({ message: 'quantity must be greater than 0' }),
    remark: z.string().max(500, { message: 'remark cannot exceed 500 characters' }).optional().nullable(),
  })
  .refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
    message: 'Destination warehouse (toWarehouseId) must be different from source warehouse (fromWarehouseId)',
    path: ['toWarehouseId'],
  });

export const updateTransferSchema = z.object({
  transferReason: z
    .enum(TRANSFER_REASONS, {
      errorMap: () => ({ message: `transferReason must be one of: ${TRANSFER_REASONS.join(', ')}` }),
    })
    .optional(),
  quantity: z.coerce
    .number({ invalid_type_error: 'quantity must be a number' })
    .positive({ message: 'quantity must be greater than 0' })
    .optional(),
  remark: z.string().max(500, { message: 'remark cannot exceed 500 characters' }).optional().nullable(),
});

