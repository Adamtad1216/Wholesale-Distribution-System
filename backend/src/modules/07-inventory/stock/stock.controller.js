import { sendSuccess, sendPaginatedSuccess, sendCreated, sendError, sendUpdated, sendDeleted } from '../../../utils/api-response.js';
import { stockIdSchema } from './stock.validation.js';
import {
  createStock,
  getStocks,
  getStockById,
  updateStock,
  deleteStock,
} from './stock.service.js';

export async function listStocks(req, res, next) {
  try {
    const { stocks, meta } = await getStocks(req.query, req.user);
    sendPaginatedSuccess(res, stocks, meta);
  } catch (err) {
    next(err);
  }
}

export async function getStock(req, res, next) {
  try {
    const idResult = stockIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid stock ID', 400);
    const stock = await getStockById(idResult.data.id, req.user);
    sendSuccess(res, stock);
  } catch (err) {
    next(err);
  }
}

export async function addStock(req, res, next) {
  try {
    const stock = await createStock(req.body, req.user.id, req, req.user);
    sendCreated(res, stock);
  } catch (err) {
    next(err);
  }
}

export async function modifyStock(req, res, next) {
  try {
    const idResult = stockIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid stock ID', 400);
    const stock = await updateStock(idResult.data.id, req.body, req.user.id, req, req.user);
    sendUpdated(res, stock, 'Stock updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function removeStock(req, res, next) {
  try {
    const idResult = stockIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid stock ID', 400);
    await deleteStock(idResult.data.id, req.user.id, req, req.user);
    sendDeleted(res, 'Stock deleted successfully');
  } catch (err) {
    next(err);
  }
}
