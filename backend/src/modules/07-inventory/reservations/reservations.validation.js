import { z } from 'zod';

export const reservationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  salesOrderId: z.string().uuid().optional(),
  status: z.enum(['RESERVED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'RELEASED', 'CANCELLED']).optional(),
});

export const reservationIdSchema = z.object({
  id: z.string().uuid(),
});

export const createReservationSchema = z.object({
  salesOrderId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
});

export const releaseReservationSchema = z.object({
  quantity: z.coerce.number().positive().optional(),
});
