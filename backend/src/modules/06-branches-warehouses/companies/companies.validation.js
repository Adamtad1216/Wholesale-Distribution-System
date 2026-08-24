import { z } from 'zod';

export const companyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const companyIdSchema = z.object({
  id: z.string().uuid(),
});

export const createCompanySchema = z.object({
  name: z.string().min(1).max(255),
  legalName: z.string().max(255).optional(),
  tradeLicenseNumber: z.string().max(100).optional(),
  tinNumber: z.string().max(100).optional(),
  vatRegistrationNumber: z.string().max(100).optional(),
  isVatRegistered: z.boolean().default(false),
  phone: z.string().max(20).optional(),
  alternatePhone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().max(255).optional(),
  logoUrl: z.string().max(500).optional(),
  regionId: z.string().uuid(),
  city: z.string().max(100).optional(),
  subCity: z.string().max(100).optional(),
  woreda: z.string().max(100).optional(),
  kebele: z.string().max(100).optional(),
  houseNumber: z.string().max(50).optional(),
  landmark: z.string().max(255).optional(),
  status: z.string().default('ACTIVE'),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  legalName: z.string().max(255).optional().nullable(),
  tradeLicenseNumber: z.string().max(100).optional().nullable(),
  tinNumber: z.string().max(100).optional().nullable(),
  vatRegistrationNumber: z.string().max(100).optional().nullable(),
  isVatRegistered: z.boolean().optional(),
  phone: z.string().max(20).optional().nullable(),
  alternatePhone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().max(255).optional().nullable(),
  logoUrl: z.string().max(500).optional().nullable(),
  regionId: z.string().uuid().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  subCity: z.string().max(100).optional().nullable(),
  woreda: z.string().max(100).optional().nullable(),
  kebele: z.string().max(100).optional().nullable(),
  houseNumber: z.string().max(50).optional().nullable(),
  landmark: z.string().max(255).optional().nullable(),
  status: z.string().optional(),
});
