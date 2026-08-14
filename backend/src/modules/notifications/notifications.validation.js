import { z } from "zod";

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  isRead: z.coerce.boolean().optional(),
  type: z.string().optional(),
});

export const notificationIdSchema = z.object({
  id: z.string().uuid(),
});

export const markAsReadSchema = z.object({
  isRead: z.boolean().default(true),
});
