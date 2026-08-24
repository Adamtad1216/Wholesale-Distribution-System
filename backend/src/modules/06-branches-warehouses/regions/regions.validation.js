import { z } from 'zod';

export const regionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  isActive: z.string().optional(),
});

export const regionIdSchema = z.object({
  id: z.string().uuid(),
});

export const createRegionSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const updateRegionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});
