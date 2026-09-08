import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import { validate } from "../../../middleware/validation.middleware.js";
import {
  vehicleQuerySchema,
  vehicleIdSchema,
  createVehicleSchema,
  updateVehicleSchema,
  assignDriverSchema,
  unassignDriverSchema,
} from "./vehicles.validation.js";
import {
  listVehiclesHandler,
  getVehicleByIdHandler,
  getEligibleDriversHandler,
  createVehicleHandler,
  updateVehicleHandler,
  assignVehicleDriverHandler,
  unassignVehicleDriverHandler,
  deleteVehicleHandler,
} from "./vehicles.controller.js";

const router = Router();
router.use(authenticate);

// Eligible drivers query (Must precede /:id)
router.get(
  "/drivers",
  requirePermission("vehicles:read"),
  getEligibleDriversHandler,
);

// List vehicles
router.get(
  "/",
  validate(vehicleQuerySchema),
  requirePermission("vehicles:read"),
  listVehiclesHandler,
);

// Get single vehicle details
router.get(
  "/:id",
  validate(vehicleIdSchema),
  requirePermission("vehicles:read"),
  getVehicleByIdHandler,
);

// Register vehicle
router.post(
  "/",
  validate(createVehicleSchema, "body"),
  requirePermission("vehicles:create"),
  createVehicleHandler,
);

// Update vehicle
router.patch(
  "/:id",
  validate(updateVehicleSchema, "body"),
  requirePermission("vehicles:update"),
  updateVehicleHandler,
);

// Assign driver to vehicle
router.post(
  "/:id/assign",
  validate(assignDriverSchema, "body"),
  requirePermission("vehicles:assign"),
  assignVehicleDriverHandler,
);

// Unassign driver from vehicle
router.post(
  "/:id/unassign",
  validate(unassignDriverSchema, "body"),
  requirePermission("vehicles:assign"),
  unassignVehicleDriverHandler,
);

// Delete/archive vehicle
router.delete(
  "/:id",
  validate(vehicleIdSchema, "params"),
  requirePermission("vehicles:delete"),
  deleteVehicleHandler,
);

export default router;
