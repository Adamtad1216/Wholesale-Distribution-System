import { z } from "zod";

export const aiQuerySchema = z.object({
  question: z.string().min(1).max(1000),
});

export const aiQueryIdSchema = z.object({
  id: z.string().uuid(),
});

export const aiQueryListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});
