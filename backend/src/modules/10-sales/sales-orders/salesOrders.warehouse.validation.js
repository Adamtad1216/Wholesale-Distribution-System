import { z } from "zod";

export const warehouseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
});

export const salesOrderActionIdSchema = z.object({
  id: z.string().uuid(),
});

export const schedulePreparationSchema = z.object({
  warehouseId: z.string().uuid(),
  storeKeeperId: z.string().uuid(),
  scheduledDate: z.string().datetime().or(z.coerce.date()),
  notes: z.string().optional(),
});

export const scheduleDeliverySchema = z.object({
  scheduledDate: z.string().datetime().or(z.coerce.date()),
  driverId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  notes: z.string().optional(),
});
