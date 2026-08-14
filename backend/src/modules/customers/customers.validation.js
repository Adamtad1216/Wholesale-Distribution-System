import { z } from "zod";

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const customerIdSchema = z.object({
  id: z.string().uuid(),
});

export const createCustomerSchema = z.object({
  customerCode: z.string().min(1).max(50),
  customerType: z.string().min(1).max(20),
  creditLimit: z.coerce.number().min(0).default(0),
  paymentTermsId: z.string().uuid().optional(),
  assignedSalesRepId: z.string().uuid().optional(),
  personId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
});

export const updateCustomerSchema = z.object({
  customerType: z.string().min(1).max(20).optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  paymentTermsId: z.string().uuid().optional(),
  assignedSalesRepId: z.string().uuid().optional(),
  personId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  status: z.string().optional(),
});
