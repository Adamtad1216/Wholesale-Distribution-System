import { z } from "zod";

export const deliveryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.string().optional(),
});

export const deliveryIdSchema = z.object({
  id: z.string().uuid(),
});

export const startDeliverySchema = z.object({});

export const completeDeliverySchema = z.object({
  proof: z
    .object({
      proofType: z.string(),
      recipientName: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});
