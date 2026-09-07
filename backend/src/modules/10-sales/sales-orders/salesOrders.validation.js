import { z } from "zod";

export const salesOrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  salesRepId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
});

export const salesOrderIdSchema = z.object({
  id: z.string().uuid(),
});

export const previewSalesOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().positive().finite().max(999999999999),
      })
    )
    .min(1),
});

export const createSalesOrderSchema = z.object({
  warehouseId: z.string().uuid(),
  requiredDate: z.string().datetime().or(z.coerce.date()).optional(),
  deliveryLocation: z
    .object({
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
      addressText: z.string().optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().positive().finite().max(999999999999),
      })
    )
    .min(1),
});

// --- Sales Rep order creation: pick existing customer OR create inline ---

const personSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});

const orgContactSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  isPrimary: z.boolean().optional(),
});

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  registrationNumber: z.string().optional(),
  taxNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  contacts: z.array(orgContactSchema).optional(),
});

const newCustomerSchema = z
  .object({
    customerType: z.enum(["PERSON", "ORGANIZATION"]),
    person: personSchema.optional(),
    organization: organizationSchema.optional(),
  })
  .refine(
    (data) =>
      (data.customerType === "PERSON" && data.person) ||
      (data.customerType === "ORGANIZATION" && data.organization),
    {
      message:
        "person is required for PERSON type; organization is required for ORGANIZATION type",
    },
  );

export const createSalesRepOrderSchema = z
  .object({
    customerId: z.string().uuid().optional(),
    newCustomer: newCustomerSchema.optional(),
    warehouseId: z.string().uuid(),
    requiredDate: z.string().datetime().or(z.coerce.date()).optional(),
    deliveryLocation: z
      .object({
        latitude: z.coerce.number().min(-90).max(90),
        longitude: z.coerce.number().min(-180).max(180),
        addressText: z.string().optional(),
      })
      .optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.coerce.number().positive().finite().max(999999999999),
        }),
      )
      .min(1),
  })
  .refine((data) => data.customerId || data.newCustomer, {
    message: "Either customerId or newCustomer must be provided",
  });