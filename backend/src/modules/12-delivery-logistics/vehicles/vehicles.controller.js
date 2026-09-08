import { AppError } from "../../../utils/errors.js";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginatedSuccess,
} from "../../../utils/api-response.js";
import {
  vehicleQuerySchema,
  vehicleIdSchema,
  createVehicleSchema,
  updateVehicleSchema,
  assignDriverSchema,
  unassignDriverSchema,
} from "./vehicles.validation.js";
import {
  listVehicles,
  getVehicleById,
  getEligibleDrivers,
  createVehicle,
  updateVehicle,
  assignVehicleDriver,
  unassignVehicleDriver,
  deleteVehicle,
} from "./vehicles.service.js";

export async function listVehiclesHandler(req, res, next) {
  try {
    const q = vehicleQuerySchema.parse(req.query);
    const result = await listVehicles(q);
    sendPaginatedSuccess(res, result.data, result.meta);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function getVehicleByIdHandler(req, res, next) {
  try {
    const { id } = vehicleIdSchema.parse(req.params);
    const vehicle = await getVehicleById(id);
    sendSuccess(res, vehicle);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function getEligibleDriversHandler(req, res, next) {
  try {
    const drivers = await getEligibleDrivers();
    sendSuccess(res, drivers);
  } catch (err) {
    next(err);
  }
}

export async function createVehicleHandler(req, res, next) {
  try {
    const data = createVehicleSchema.parse(req.body);
    const vehicle = await createVehicle(data, req.user);
    sendCreated(res, vehicle);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function updateVehicleHandler(req, res, next) {
  try {
    const { id } = vehicleIdSchema.parse(req.params);
    const data = updateVehicleSchema.parse(req.body);
    const updated = await updateVehicle(id, data, req.user);
    sendSuccess(res, updated);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function assignVehicleDriverHandler(req, res, next) {
  try {
    const { id } = vehicleIdSchema.parse(req.params);
    const { driverId, notes } = assignDriverSchema.parse(req.body);
    const result = await assignVehicleDriver(id, driverId, notes, req.user);
    sendSuccess(res, result);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function unassignVehicleDriverHandler(req, res, next) {
  try {
    const { id } = vehicleIdSchema.parse(req.params);
    const { notes } = unassignDriverSchema.parse(req.body || {});
    const result = await unassignVehicleDriver(id, notes, req.user);
    sendSuccess(res, result);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function deleteVehicleHandler(req, res, next) {
  try {
    const { id } = vehicleIdSchema.parse(req.params);
    await deleteVehicle(id, req.user);
    sendNoContent(res);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}
