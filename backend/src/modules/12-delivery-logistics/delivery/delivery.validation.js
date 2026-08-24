import { z } from "zod";

export const deliveryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.string().optional(),
  salesOrderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  scheduledDateFrom: z.string().datetime().optional(),
  scheduledDateTo: z.string().datetime().optional(),
});

export const deliveryIdSchema = z.object({
  id: z.string().uuid(),
});

export const createDeliverySchema = z.object({
  salesOrderId: z.string().uuid(),
  customerId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  driverId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  scheduledDate: z.string().datetime().or(z.coerce.date()),
  deliveryAddress: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      salesOrderItemId: z.string().uuid(),
      productId: z.string().uuid(),
      quantity: z.coerce.number().positive(),
    })
  ).min(1),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.string().min(1),
  deliveryDate: z.string().datetime().or(z.coerce.date()).optional(),
});

export const createDeliveryProofSchema = z.object({
  proofType: z.string().min(1),
  fileUrl: z.string().url().optional(),
  recipientName: z.string().optional(),
  recipientSignature: z.string().optional(),
  notes: z.string().optional(),
});
