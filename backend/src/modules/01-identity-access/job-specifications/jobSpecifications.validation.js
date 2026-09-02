import { z } from 'zod';

export const jobSpecificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
});

export const jobSpecificationIdSchema = z.object({
  id: z.string().uuid(),
});

export const createJobSpecificationSchema = z.object({
  code: z.string().max(50).optional(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  department: z.string().max(255).optional(),
  status: z.string().default('ACTIVE'),
});

export const updateJobSpecificationSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  department: z.string().max(255).optional().nullable(),
  status: z.string().optional(),
});
