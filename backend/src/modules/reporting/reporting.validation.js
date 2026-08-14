import { z } from "zod";

export const reportQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  type: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const reportIdSchema = z.object({
  id: z.string().uuid(),
});

export const salesReportSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  customerId: z.string().uuid().optional(),
  salesRepId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
});

export const deliveryReportSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  driverId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
});
