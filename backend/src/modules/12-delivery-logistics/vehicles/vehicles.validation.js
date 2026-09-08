import { z } from "zod";

const uuid = z.string().uuid();

export const vehicleQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).optional(),
  vehicleType: z.string().optional(),
  assigned: z.enum(["true", "false", "all"]).optional().default("all"),
  search: z.string().optional(),
});

export const vehicleIdSchema = z.object({
  id: uuid,
});

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(2).max(50).trim(),
  vehicleType: z.string().min(2).max(50).trim(), // TRUCK, VAN, PICKUP, LORRY, MOTORCYCLE, etc.
  make: z.string().max(50).trim().optional().nullable(),
  model: z.string().max(50).trim().optional().nullable(),
  year: z.coerce.number().int().min(1970).max(2100).optional().nullable(),
  capacity: z.coerce.number().nonnegative().optional().nullable(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).optional().default("ACTIVE"),
  notes: z.string().max(1000).optional().nullable(),
  assignedDriverId: uuid.optional().nullable(),
});

export const updateVehicleSchema = z
  .object({
    plateNumber: z.string().min(2).max(50).trim().optional(),
    vehicleType: z.string().min(2).max(50).trim().optional(),
    make: z.string().max(50).trim().optional().nullable(),
    model: z.string().max(50).trim().optional().nullable(),
    year: z.coerce.number().int().min(1970).max(2100).optional().nullable(),
    capacity: z.coerce.number().nonnegative().optional().nullable(),
    status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).optional(),
    notes: z.string().max(1000).optional().nullable(),
    assignedDriverId: uuid.optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export const assignDriverSchema = z.object({
  driverId: uuid,
  notes: z.string().max(500).optional().nullable(),
});

export const unassignDriverSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
});
