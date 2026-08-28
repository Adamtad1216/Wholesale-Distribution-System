import { z } from 'zod';

export const categoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

export const categoryIdSchema = z.object({
  id: z.string().uuid(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  parentId: z.string().uuid().nullish(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  parentId: z.string().uuid().nullish(),
});
