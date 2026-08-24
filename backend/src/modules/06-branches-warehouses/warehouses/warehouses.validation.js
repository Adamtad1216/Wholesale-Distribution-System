import { z } from 'zod';

export const warehouseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  branchId: z.string().uuid().optional(),
  status: z.string().optional(),
});

export const warehouseIdSchema = z.object({
  id: z.string().uuid(),
});

export const createWarehouseSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  branchId: z.string().uuid(),
  location: z.string().max(255).optional(),
  regionId: z.string().uuid(),
  city: z.string().max(100).optional(),
  subCity: z.string().max(100).optional(),
  woreda: z.string().max(100).optional(),
  kebele: z.string().max(100).optional(),
  houseNumber: z.string().max(50).optional(),
  managerId: z.string().uuid().optional(),
  status: z.string().default('ACTIVE'),
});

export const updateWarehouseSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  branchId: z.string().uuid().optional(),
  location: z.string().max(255).optional().nullable(),
  regionId: z.string().uuid().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  subCity: z.string().max(100).optional().nullable(),
  woreda: z.string().max(100).optional().nullable(),
  kebele: z.string().max(100).optional().nullable(),
  houseNumber: z.string().max(50).optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  status: z.string().optional(),
});
