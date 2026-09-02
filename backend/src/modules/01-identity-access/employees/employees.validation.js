import { z } from 'zod';

export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  jobSpecificationId: z.string().uuid().optional(),
  status: z.string().optional(),
  hasUserAccount: z.string().optional(),
});

export const employeeIdSchema = z.object({
  id: z.string().uuid(),
});

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(255).optional(),
  employeeCode: z.string().min(1).max(50).optional(),
  hireDate: z.string().min(1),
  department: z.string().max(255).optional(),
  jobSpecificationId: z.string().uuid(),
  status: z.string().default('ACTIVE'),
  needsUserAccount: z.boolean().default(false),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
  roleId: z.string().uuid().optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  salesTerritory: z.string().max(255).optional(),
  driverLicenseNumber: z.string().max(50).optional(),
  driverLicenseExpiry: z.string().optional(),
  branchId: z.string().uuid().optional(),
  isAvailableForSales: z.boolean().default(true),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  middleName: z.string().max(100).optional().nullable(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  employeeCode: z.string().min(1).max(50).optional(),
  department: z.string().max(255).optional().nullable(),
  jobSpecificationId: z.string().uuid().optional(),
  status: z.string().optional(),
  needsUserAccount: z.boolean().optional(),
  username: z.string().min(3).max(50).optional().nullable(),
  password: z.string().min(6).max(100).optional().nullable(),
  roleId: z.string().uuid().optional().nullable(),
  commissionRate: z.coerce.number().min(0).max(100).optional().nullable(),
  salesTerritory: z.string().max(255).optional().nullable(),
  driverLicenseNumber: z.string().max(50).optional().nullable(),
  driverLicenseExpiry: z.string().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  isAvailableForSales: z.boolean().optional(),
});
