import { z } from 'zod';

export const createPermissionSchema = z.object({
  name: z.string().min(1).max(255),
  module: z.string().min(1).max(100),
  action: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
});

export const updatePermissionSchema = z.object({
  name: z.string().max(255).optional(),
  module: z.string().max(100).optional(),
  action: z.string().max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});
