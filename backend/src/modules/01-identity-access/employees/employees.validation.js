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
  jobSpecificationIds: z.array(z.string().uuid()).min(1),
  status: z.string().default('ACTIVE'),
  needsUserAccount: z.boolean().default(false),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  salesTerritory: z.string().max(255).optional(),
  driverLicenseNumber: z.string().max(50).optional(),
  driverLicenseExpiry: z.string().optional(),
  branchId: z.string().uuid(),
  isAvailableForSales: z.boolean().default(true),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(8).max(100).optional(),
  roleIds: z.array(z.string().uuid()).min(1).optional(),
}).refine(
  (data) => {
    if (data.needsUserAccount && data.username) {
      return !!data.roleIds && data.roleIds.length > 0;
    }
    return true;
  },
  {
    message: 'roleIds is required when creating an employee with a user account and username',
    path: ['roleIds'],
  }
);

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  middleName: z.string().max(100).optional().nullable(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  employeeCode: z.string().min(1).max(50).optional(),
  department: z.string().max(255).optional().nullable(),
  jobSpecificationIds: z.array(z.string().uuid()).min(1).optional(),
  status: z.string().optional(),
  needsUserAccount: z.boolean().optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional().nullable(),
  salesTerritory: z.string().max(255).optional().nullable(),
  driverLicenseNumber: z.string().max(50).optional().nullable(),
  driverLicenseExpiry: z.string().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  isAvailableForSales: z.boolean().optional(),
});
