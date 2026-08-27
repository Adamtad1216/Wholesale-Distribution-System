import { z } from 'zod';

export const brandQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const brandIdSchema = z.object({
  id: z.string().uuid(),
});

export const createBrandSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  status: z.string().default('ACTIVE'),
});

export const updateBrandSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: z.string().optional(),
});
