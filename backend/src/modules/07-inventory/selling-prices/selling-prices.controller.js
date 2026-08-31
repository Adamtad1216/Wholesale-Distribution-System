import { sendSuccess, sendPaginatedSuccess, sendCreated, sendError, sendUpdated, sendDeleted } from '../../../utils/api-response.js';
import { sellingPriceIdSchema } from './selling-prices.validation.js';
import {
  createSellingPrice,
  getSellingPrices,
  getSellingPriceById,
  updateSellingPrice,
  deleteSellingPrice,
} from './selling-prices.service.js';

export async function listSellingPrices(req, res, next) {
  try {
    const { sellingPrices, meta } = await getSellingPrices(req.query);
    sendPaginatedSuccess(res, sellingPrices, meta);
  } catch (err) {
    next(err);
  }
}

export async function getSellingPrice(req, res, next) {
  try {
    const idResult = sellingPriceIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid selling price ID', 400);
    const sellingPrice = await getSellingPriceById(idResult.data.id);
    sendSuccess(res, sellingPrice);
  } catch (err) {
    next(err);
  }
}

export async function addSellingPrice(req, res, next) {
  try {
    const sellingPrice = await createSellingPrice(req.body, req.user.id, req);
    sendCreated(res, sellingPrice);
  } catch (err) {
    next(err);
  }
}

export async function modifySellingPrice(req, res, next) {
  try {
    const idResult = sellingPriceIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid selling price ID', 400);
    const sellingPrice = await updateSellingPrice(idResult.data.id, req.body, req.user.id, req);
    sendUpdated(res, sellingPrice, 'Selling price updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function removeSellingPrice(req, res, next) {
  try {
    const idResult = sellingPriceIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid selling price ID', 400);
    await deleteSellingPrice(idResult.data.id, req.user.id, req);
    sendDeleted(res, 'Selling price deleted successfully');
  } catch (err) {
    next(err);
  }
}
