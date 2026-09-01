import { z } from "zod";

export const approveSalesOrderSchema = z.object({});

export const rejectSalesOrderSchema = z.object({
  reason: z.string().min(1).max(1000),
});

export const requestAdjustmentSchema = z.object({
  reason: z.string().min(1).max(1000),
});

export const salesOrderActionIdSchema = z.object({
  id: z.string().uuid(),
});
