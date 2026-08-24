import { z } from 'zod';

export const branchQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  companyId: z.string().uuid().optional(),
  status: z.string().optional(),
});

export const branchIdSchema = z.object({
  id: z.string().uuid(),
});

export const createBranchSchema = z.object({
  companyId: z.string().uuid(),
  branchCode: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  isHeadOffice: z.boolean().default(false),
  managerId: z.string().uuid().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  regionId: z.string().uuid(),
  city: z.string().max(100).optional(),
  subCity: z.string().max(100).optional(),
  woreda: z.string().max(100).optional(),
  kebele: z.string().max(100).optional(),
  houseNumber: z.string().max(50).optional(),
  landmark: z.string().max(255).optional(),
  status: z.string().default('ACTIVE'),
});

export const updateBranchSchema = z.object({
  companyId: z.string().uuid().optional(),
  branchCode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  isHeadOffice: z.boolean().optional(),
  managerId: z.string().uuid().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  regionId: z.string().uuid().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  subCity: z.string().max(100).optional().nullable(),
  woreda: z.string().max(100).optional().nullable(),
  kebele: z.string().max(100).optional().nullable(),
  houseNumber: z.string().max(50).optional().nullable(),
  landmark: z.string().max(255).optional().nullable(),
  status: z.string().optional(),
});
