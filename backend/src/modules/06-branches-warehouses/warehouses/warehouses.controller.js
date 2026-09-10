import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent, sendError } from "../../../utils/api-response.js";
import { warehouseIdSchema } from './warehouses.validation.js';
import {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  getEligibleManagers,
  assignWarehouseManager,
} from './warehouses.service.js';

export async function listWarehouses(req, res, next) {
  try {
    const filters = { ...req.query };
    const { warehouses, meta } = await getWarehouses(filters, req.user);
    sendPaginatedSuccess(res, warehouses, meta);
  } catch (err) {
    next(err);
  }
}

export async function listEligibleManagers(req, res, next) {
  try {
    const managers = await getEligibleManagers();
    sendSuccess(res, managers);
  } catch (err) {
    next(err);
  }
}

export async function setWarehouseManager(req, res, next) {
  try {
    const idResult = warehouseIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid warehouse ID', 400);
    }
    const { employeeId, notes } = req.body;
    const warehouse = await assignWarehouseManager(idResult.data.id, employeeId, notes, req.user.id, req);
    sendSuccess(res, warehouse);
  } catch (err) {
    next(err);
  }
}

export async function getWarehouse(req, res, next) {
  try {
    const idResult = warehouseIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid warehouse ID', 400);
    }
    const warehouse = await getWarehouseById(idResult.data.id, req.user);
    sendSuccess(res, warehouse);
  } catch (err) {
    next(err);
  }
}

export async function addWarehouse(req, res, next) {
  try {
    const warehouse = await createWarehouse(req.body, req.user.id, req);
    sendCreated(res, warehouse);
  } catch (err) {
    next(err);
  }
}

export async function modifyWarehouse(req, res, next) {
  try {
    const idResult = warehouseIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid warehouse ID', 400);
    }
    const warehouse = await updateWarehouse(idResult.data.id, req.body, req.user.id, req);
    sendSuccess(res, warehouse);
  } catch (err) {
    next(err);
  }
}

export async function removeWarehouse(req, res, next) {
  try {
    const idResult = warehouseIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid warehouse ID', 400);
    }
    await deleteWarehouse(idResult.data.id, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

