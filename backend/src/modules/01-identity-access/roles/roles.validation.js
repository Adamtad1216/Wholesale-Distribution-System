import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
});

export const updateRoleSchema = z.object({
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});

export const assignPermissionSchema = z.object({
  permissionId: z.string().uuid(),
});
