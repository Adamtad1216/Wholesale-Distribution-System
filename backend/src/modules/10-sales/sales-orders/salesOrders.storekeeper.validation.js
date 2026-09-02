import { z } from "zod";

export const preparationTaskIdSchema = z.object({
  id: z.string().uuid(),
});

export const preparationTaskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.string().optional(),
});

export const markPreparedSchema = z.object({
  items: z
    .array(
      z.object({
        preparationTaskItemId: z.string().uuid(),
        preparedQuantity: z.coerce.number().positive().finite(),
      })
    )
    .min(1),
});

export const completeTaskSchema = z.object({});
