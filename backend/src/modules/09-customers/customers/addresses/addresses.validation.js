import { z } from 'zod';

export const customerAddressIdSchema = z.object({
  id: z.string().uuid(),
});

export const createCustomerAddressSchema = z.object({
  label: z.string().max(100).optional(),
  address: z.string().min(1, 'Address is required').max(255),
  city: z.string().max(100).optional(),
  subCity: z.string().max(100).optional(),
  woreda: z.string().max(100).optional(),
  landmark: z.string().max(255).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateCustomerAddressSchema = z.object({
  label: z.string().max(100).optional().nullable(),
  address: z.string().min(1, 'Address is required').max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  subCity: z.string().max(100).optional().nullable(),
  woreda: z.string().max(100).optional().nullable(),
  landmark: z.string().max(255).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  isDefault: z.boolean().optional().nullable(),
  isActive: z.boolean().optional().nullable(),
});
