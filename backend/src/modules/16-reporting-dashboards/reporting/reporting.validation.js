import { z } from "zod";

const err = (msg) => ({ message: msg });

const dateString = z
  .string()
  .refine((val) => !isNaN(new Date(val).getTime()), err("Invalid date format"));

const optionalDateString = z.string().transform((val, ctx) => {
  if (val === undefined) return undefined;
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid date format",
    });
    return z.NEVER;
  }
  return val;
});

const uuidString = z.string().uuid(err("Invalid UUID"));

const salesOrderStatusValues = [
  "DRAFT",
  "PENDING_REVIEW",
  "ADJUSTMENT_REQUIRED",
  "APPROVED",
  "REJECTED",
  "RESERVED",
  "READY_FOR_DELIVERY",
  "PARTIALLY_FULFILLED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "SALES_REP_APPROVED",
  "WAREHOUSE_PREPARATION_SCHEDULED",
  "PREPARING",
  "DELIVERY_SCHEDULED",
  "OUT_FOR_DELIVERY",
];

const deliveryStatusValues = [
  "SCHEDULED",
  "DISPATCHED",
  "IN_TRANSIT",
  "DELIVERED",
  "PARTIAL",
  "FAILED",
  "RETURNED",
  "CANCELLED",
];

const dateRangeRefine = {
  refinements: (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  message: "startDate must be before or equal to endDate",
};

const paginationFields = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
};

export const dashboardQuerySchema = z.object({});

export const salesReportQuerySchema = z
  .object({
    startDate: optionalDateString.optional(),
    endDate: optionalDateString.optional(),
    salesRepId: uuidString.optional(),
    customerId: uuidString.optional(),
    productId: uuidString.optional(),
    status: z.enum(salesOrderStatusValues).optional(),
  })
  .refine(dateRangeRefine.refinements, err(dateRangeRefine.message));

export const productSalesQuerySchema = z
  .object({
    startDate: optionalDateString.optional(),
    endDate: optionalDateString.optional(),
    categoryId: uuidString.optional(),
    productId: uuidString.optional(),
    ...paginationFields,
  })
  .refine(dateRangeRefine.refinements, err(dateRangeRefine.message));

export const customerReportQuerySchema = z
  .object({
    startDate: optionalDateString.optional(),
    endDate: optionalDateString.optional(),
    ...paginationFields,
  })
  .refine(dateRangeRefine.refinements, err(dateRangeRefine.message));

export const salesRepReportQuerySchema = z
  .object({
    startDate: optionalDateString.optional(),
    endDate: optionalDateString.optional(),
    ...paginationFields,
  })
  .refine(dateRangeRefine.refinements, err(dateRangeRefine.message));

export const orderStatusQuerySchema = z.object({});

export const warehouseReportQuerySchema = z.object({});

export const deliveryReportQuerySchema = z
  .object({
    startDate: optionalDateString.optional(),
    endDate: optionalDateString.optional(),
    driverId: uuidString.optional(),
    status: z.enum(deliveryStatusValues).optional(),
  })
  .refine(dateRangeRefine.refinements, err(dateRangeRefine.message));

export { dateString, uuidString, salesOrderStatusValues, deliveryStatusValues };
