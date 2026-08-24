import { z } from 'zod';

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  role: z.string().optional(),
  isActive: z.string().optional(),
});

export const userIdSchema = z.object({
  id: z.string().uuid(),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(255).optional(),
  roleIds: z.array(z.string().uuid()).min(1),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  middleName: z.string().max(100).optional().nullable(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string().uuid()).min(1).optional(),
});

export const resetUserPasswordSchema = z.object({
  password: z.string().min(8).max(100),
});
