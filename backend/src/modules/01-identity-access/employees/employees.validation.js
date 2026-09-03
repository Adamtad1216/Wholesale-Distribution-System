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

const emptyToUndefined = (val) => (val === '' ? undefined : val);

export const createEmployeeSchema = z.preprocess(
  (raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const data = { ...raw };
    if (data.jobSpecificationId && (!data.jobSpecificationIds || data.jobSpecificationIds.length === 0)) {
      data.jobSpecificationIds = [data.jobSpecificationId];
    }
    if (data.roleId && (!data.roleIds || data.roleIds.length === 0)) {
      data.roleIds = [data.roleId];
    }
    if (data.email === '') data.email = undefined;
    if (data.phone === '') data.phone = undefined;
    if (data.middleName === '') data.middleName = undefined;
    if (data.employeeCode === '') data.employeeCode = undefined;
    if (data.department === '') data.department = undefined;
    if (data.username === '') data.username = undefined;
    if (data.password === '') data.password = undefined;
    if (data.roleId === '') data.roleId = undefined;
    return data;
  },
  z.object({
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
    jobSpecificationId: z.string().uuid().optional(),
    status: z.string().default('ACTIVE'),
    needsUserAccount: z.boolean().default(false),
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(6).max(100).optional(),
    roleId: z.string().uuid().optional(),
    roleIds: z.array(z.string().uuid()).min(1).optional(),
    commissionRate: z.coerce.number().min(0).max(100).optional(),
    salesTerritory: z.string().max(255).optional(),
    driverLicenseNumber: z.string().max(50).optional(),
    driverLicenseExpiry: z.string().optional(),
    branchId: z.string().uuid({ message: 'Branch ID is required' }),
    isAvailableForSales: z.boolean().default(true),
  }).refine(
    (data) => {
      if (data.needsUserAccount && data.username) {
        return (!!data.roleIds && data.roleIds.length > 0) || !!data.roleId;
      }
      return true;
    },
    {
      message: 'A role is required when creating an employee with a user account',
      path: ['roleId'],
    }
  )
);

export const updateEmployeeSchema = z.preprocess(
  (raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const data = { ...raw };
    if (data.jobSpecificationId && (!data.jobSpecificationIds || data.jobSpecificationIds.length === 0)) {
      data.jobSpecificationIds = [data.jobSpecificationId];
    }
    if (data.roleId && (!data.roleIds || data.roleIds.length === 0)) {
      data.roleIds = [data.roleId];
    }
    if (data.email === '') data.email = null;
    if (data.phone === '') data.phone = null;
    if (data.middleName === '') data.middleName = null;
    if (data.department === '') data.department = null;
    if (data.branchId === '') data.branchId = null;
    return data;
  },
  z.object({
    firstName: z.string().min(1).max(100).optional(),
    middleName: z.string().max(100).optional().nullable(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().max(255).optional().nullable(),
    employeeCode: z.string().min(1).max(50).optional(),
    department: z.string().max(255).optional().nullable(),
    jobSpecificationIds: z.array(z.string().uuid()).min(1).optional(),
    jobSpecificationId: z.string().uuid().optional().nullable(),
    status: z.string().optional(),
    needsUserAccount: z.boolean().optional(),
    username: z.string().min(3).max(50).optional().nullable(),
    password: z.string().min(6).max(100).optional().nullable(),
    roleId: z.string().uuid().optional().nullable(),
    roleIds: z.array(z.string().uuid()).min(1).optional(),
    commissionRate: z.coerce.number().min(0).max(100).optional().nullable(),
    salesTerritory: z.string().max(255).optional().nullable(),
    driverLicenseNumber: z.string().max(50).optional().nullable(),
    driverLicenseExpiry: z.string().optional().nullable(),
    branchId: z.string().uuid().optional().nullable(),
    isAvailableForSales: z.boolean().optional(),
  })
);
