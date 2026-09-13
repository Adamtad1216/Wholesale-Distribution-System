import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendError,
} from '../../../utils/api-response.js';
import { stockAdditionIdSchema } from './stock-additions.validation.js';
import {
  createStockAddition,
  getStockAdditions,
  getStockAdditionById,
  updateStockAddition,
  deleteStockAddition,
} from './stock-additions.service.js';

export async function listStockAdditions(req, res, next) {
  try {
    const { additions, meta } = await getStockAdditions(req.query, req.user);
    sendPaginatedSuccess(res, additions, meta);
  } catch (err) {
    next(err);
  }
}

export async function getStockAddition(req, res, next) {
  try {
    const idResult = stockAdditionIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid stock addition ID', 400);
    const addition = await getStockAdditionById(idResult.data.id, req.user);
    sendSuccess(res, addition);
  } catch (err) {
    next(err);
  }
}

export async function addStockAddition(req, res, next) {
  try {
    const addition = await createStockAddition(req.body, req.user.id, req, req.user);
    sendCreated(res, addition);
  } catch (err) {
    next(err);
  }
}

export async function modifyStockAddition(req, res, next) {
  try {
    const idResult = stockAdditionIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid stock addition ID', 400);
    const addition = await updateStockAddition(idResult.data.id, req.body, req.user.id, req, req.user);
    sendUpdated(res, addition, 'Stock addition updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function removeStockAddition(req, res, next) {
  try {
    const idResult = stockAdditionIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid stock addition ID', 400);
    await deleteStockAddition(idResult.data.id, req.user.id, req, req.user);
    sendDeleted(res, 'Stock addition deleted successfully');
  } catch (err) {
    next(err);
  }
}
