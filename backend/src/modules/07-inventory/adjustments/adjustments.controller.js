import { sendSuccess, sendPaginatedSuccess, sendCreated, sendError, sendUpdated, sendDeleted } from '../../../utils/api-response.js';
import { adjustmentIdSchema } from './adjustments.validation.js';
import {
  createAdjustment,
  getAdjustments,
  getAdjustmentById,
  updateAdjustment,
  approveAdjustment,
  deleteAdjustment,
  getAdjustmentItem,
  addAdjustmentItem,
  updateAdjustmentItem,
  removeAdjustmentItem,
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

export async function modifyAdjustment(req, res, next) {
  try {
    const idResult = adjustmentIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid adjustment ID', 400);
    const adjustment = await updateAdjustment(idResult.data.id, req.body, req.user.id, req);
    sendUpdated(res, adjustment, 'Adjustment updated successfully');
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

export async function getAdjustmentItemHandler(req, res, next) {
  try {
    const idResult = adjustmentIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid adjustment ID', 400);
    const item = await getAdjustmentItem(idResult.data.id, req.params.itemId);
    sendSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function addAdjustmentItemHandler(req, res, next) {
  try {
    const idResult = adjustmentIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid adjustment ID', 400);
    const item = await addAdjustmentItem(idResult.data.id, req.body, req.user.id, req);
    sendCreated(res, item);
  } catch (err) {
    next(err);
  }
}

export async function modifyAdjustmentItem(req, res, next) {
  try {
    const idResult = adjustmentIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid adjustment ID', 400);
    const item = await updateAdjustmentItem(idResult.data.id, req.params.itemId, req.body, req.user.id, req);
    sendUpdated(res, item, 'Adjustment item updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function removeAdjustmentItemHandler(req, res, next) {
  try {
    const idResult = adjustmentIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid adjustment ID', 400);
    await removeAdjustmentItem(idResult.data.id, req.params.itemId, req.user.id, req);
    sendDeleted(res, 'Adjustment item removed successfully');
  } catch (err) {
    next(err);
  }
}
