import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent, sendError } from "../../../utils/api-response.js";
import { unitIdSchema } from "./units.validation.js";
import {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
} from "./units.service.js";

export async function listUnits(req, res, next) {
  try {
    const filters = { ...req.query };
    const { units, meta } = await getUnits(filters);
    sendPaginatedSuccess(res, units, meta);
  } catch (err) {
    next(err);
  }
}

export async function getUnit(req, res, next) {
  try {
    const idResult = unitIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid unit ID', 400);
    }
    const unit = await getUnitById(idResult.data.id);
    sendSuccess(res, unit);
  } catch (err) {
    next(err);
  }
}

export async function addUnit(req, res, next) {
  try {
    const unit = await createUnit(req.body, req.user.id, req);
    sendCreated(res, unit);
  } catch (err) {
    next(err);
  }
}

export async function modifyUnit(req, res, next) {
  try {
    const idResult = unitIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid unit ID', 400);
    }
    const unit = await updateUnit(idResult.data.id, req.body, req.user.id, req);
    sendSuccess(res, unit);
  } catch (err) {
    next(err);
  }
}

export async function removeUnit(req, res, next) {
  try {
    const idResult = unitIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid unit ID', 400);
    }
    await deleteUnit(idResult.data.id, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
