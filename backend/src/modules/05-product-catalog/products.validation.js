import { z } from "zod";

const uuid = z.string().uuid();

export const productIdSchema = z.object({ id: uuid });

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
});
