import { z } from 'zod';

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  customerType: z.enum(['PERSON', 'ORGANIZATION']).optional(),
  status: z.string().optional(),
  salesRepId: z.string().uuid().optional(),
  paymentTermsId: z.string().uuid().optional(),
});

export const customerIdSchema = z.object({
  id: z.string().uuid(),
});

export const createCustomerSchema = z.discriminatedUnion('customerType', [
  z.object({
    customerType: z.literal('PERSON'),
    customerCode: z.string().min(1).max(50).optional(),
    creditLimit: z.coerce.number().min(0).default(0),
    paymentTermsId: z.string().uuid().optional(),
    assignedSalesRepId: z.string().uuid().optional(),
    status: z.string().default('ACTIVE'),
    person: z.object({
      firstName: z.string().min(1).max(100),
      middleName: z.string().max(100).optional(),
      lastName: z.string().min(1).max(100),
      phone: z.string().max(20).optional(),
      email: z.string().email().optional(),
      address: z.string().max(255).optional(),
    }),
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(8).max(100).optional(),
  }),
  z.object({
    customerType: z.literal('ORGANIZATION'),
    customerCode: z.string().min(1).max(50).optional(),
    creditLimit: z.coerce.number().min(0).default(0),
    paymentTermsId: z.string().uuid().optional(),
    assignedSalesRepId: z.string().uuid().optional(),
    status: z.string().default('ACTIVE'),
    organization: z.object({
      name: z.string().min(1).max(255),
      registrationNumber: z.string().max(100).optional(),
      taxNumber: z.string().max(100).optional(),
      phone: z.string().max(20).optional(),
      email: z.string().email().optional(),
      address: z.string().max(255).optional(),
      contacts: z.array(
        z.object({
          firstName: z.string().min(1).max(100),
          middleName: z.string().max(100).optional(),
          lastName: z.string().min(1).max(100),
          phone: z.string().max(20).optional(),
          email: z.string().email().optional(),
          address: z.string().max(255).optional(),
          position: z.string().max(100).optional(),
          isPrimary: z.boolean().default(false),
        })
      ).optional(),
    }),
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(8).max(100).optional(),
  }),
]);

export const updateCustomerSchema = z.object({
  customerType: z.enum(['PERSON', 'ORGANIZATION']).optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  paymentTermsId: z.string().uuid().optional().nullable(),
  assignedSalesRepId: z.string().uuid().optional().nullable(),
  status: z.string().optional(),
  person: z
    .object({
      firstName: z.string().min(1).max(100).optional(),
      middleName: z.string().max(100).optional().nullable(),
      lastName: z.string().min(1).max(100).optional(),
      phone: z.string().max(20).optional().nullable(),
      email: z.string().email().optional().nullable(),
      address: z.string().max(255).optional().nullable(),
    })
    .optional(),
  organization: z
    .object({
      name: z.string().min(1).max(255).optional(),
      registrationNumber: z.string().max(100).optional().nullable(),
      taxNumber: z.string().max(100).optional().nullable(),
      phone: z.string().max(20).optional().nullable(),
      email: z.string().email().optional().nullable(),
      address: z.string().max(255).optional().nullable(),
      contacts: z.array(
        z.object({
          firstName: z.string().min(1).max(100),
          middleName: z.string().max(100).optional(),
          lastName: z.string().min(1).max(100),
          phone: z.string().max(20).optional(),
          email: z.string().email().optional(),
          address: z.string().max(255).optional(),
          position: z.string().max(100).optional(),
          isPrimary: z.boolean().default(false),
        })
      ).optional(),
    })
    .optional(),
});
