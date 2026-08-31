import { z } from 'zod';

export const movementQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  movementType: z.enum([
    'PURCHASE_RECEIPT',
    'SALES_RESERVATION',
    'SALES_FULFILLMENT',
    'SALES_RETURN',
    'PURCHASE_RETURN',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT',
    'TRANSFER_IN',
    'TRANSFER_OUT',
  ]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const createMovementSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  movementType: z.enum([
    'PURCHASE_RECEIPT',
    'SALES_RESERVATION',
    'SALES_FULFILLMENT',
    'SALES_RETURN',
    'PURCHASE_RETURN',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT',
    'TRANSFER_IN',
    'TRANSFER_OUT',
  ]),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});
