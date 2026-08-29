import { sendSuccess, sendPaginatedSuccess, sendCreated, sendError, sendUpdated, sendDeleted } from '../../../utils/api-response.js';
import { adjustmentIdSchema } from './adjustments.validation.js';
import {
  createAdjustment,
  getAdjustments,
  getAdjustmentById,
  approveAdjustment,
  deleteAdjustment,
} from './adjustments.service.js';

export async function listAdjustments(req, res, next) {
  try {
    const { adjustments, meta } = await getAdjustments(req.query);
    sendPaginatedSuccess(res, adjustments, meta);
  } catch (err) {
    next(err);
  }
}

export async function getAdjustment(req, res, next) {
  try {
    const idResult = adjustmentIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid adjustment ID', 400);
    const adjustment = await getAdjustmentById(idResult.data.id);
    sendSuccess(res, adjustment);
  } catch (err) {
    next(err);
  }
}

export async function addAdjustment(req, res, next) {
  try {
    const adjustment = await createAdjustment(req.body, req.user.id, req);
    sendCreated(res, adjustment);
  } catch (err) {
    next(err);
  }
}

export async function approveOrRejectAdjustment(req, res, next) {
  try {
    const idResult = adjustmentIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid adjustment ID', 400);
    const adjustment = await approveAdjustment(idResult.data.id, req.body, req.user.id, req);
    sendUpdated(res, adjustment, 'Adjustment processed successfully');
  } catch (err) {
    next(err);
  }
}

export async function removeAdjustment(req, res, next) {
  try {
    const idResult = adjustmentIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid adjustment ID', 400);
    await deleteAdjustment(idResult.data.id, req.user.id, req);
    sendDeleted(res, 'Stock adjustment deleted successfully');
  } catch (err) {
    next(err);
  }
}
