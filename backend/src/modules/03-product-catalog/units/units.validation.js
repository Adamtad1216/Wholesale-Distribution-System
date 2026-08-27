import { z } from 'zod';

export const unitQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
});

export const unitIdSchema = z.object({
  id: z.string().uuid(),
});

export const createUnitSchema = z.object({
  name: z.string().min(1).max(255),
  abbreviation: z.string().min(1).max(20),
});

export const updateUnitSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  abbreviation: z.string().min(1).max(20).optional(),
});
