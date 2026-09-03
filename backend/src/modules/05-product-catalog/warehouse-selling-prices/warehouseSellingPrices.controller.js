import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent, sendError } from "../../../utils/api-response.js";
import {
  productIdParamSchema,
  getWarehousePriceByProductQuerySchema,
} from "./warehouseSellingPrices.validation.js";
import {
  createWarehouseSellingPrice,
  getWarehouseSellingPrices,
  getWarehouseSellingPricesByProductId,
  updateWarehouseSellingPriceByProductId,
  deleteWarehouseSellingPriceByProductId,
} from "./warehouseSellingPrices.service.js";

export async function listWarehouseSellingPrices(req, res, next) {
  try {
    const filters = { ...req.query };
    const { prices, meta } = await getWarehouseSellingPrices(filters);
    sendPaginatedSuccess(res, prices, meta);
  } catch (err) {
    next(err);
  }
}

export async function getWarehouseSellingPrice(req, res, next) {
  try {
    const idResult = productIdParamSchema.safeParse({ productId: req.params.productId });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const queryResult = getWarehousePriceByProductQuerySchema.safeParse(req.query);
    const warehouseId = queryResult.success ? queryResult.data.warehouseId : null;

    const price = await getWarehouseSellingPricesByProductId(idResult.data.productId, warehouseId);
    sendSuccess(res, price);
  } catch (err) {
    next(err);
  }
}

export async function addWarehouseSellingPrice(req, res, next) {
  try {
    const price = await createWarehouseSellingPrice(req.body, req.user.id, req);
    sendCreated(res, price);
  } catch (err) {
    next(err);
  }
}

export async function modifyWarehouseSellingPrice(req, res, next) {
  try {
    const idResult = productIdParamSchema.safeParse({ productId: req.params.productId });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const price = await updateWarehouseSellingPriceByProductId(idResult.data.productId, req.body, req.user.id, req);
    sendSuccess(res, price);
  } catch (err) {
    next(err);
  }
}

export async function removeWarehouseSellingPrice(req, res, next) {
  try {
    const idResult = productIdParamSchema.safeParse({ productId: req.params.productId });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const queryResult = getWarehousePriceByProductQuerySchema.safeParse(req.query);
    const warehouseId = queryResult.success ? queryResult.data.warehouseId : null;

    await deleteWarehouseSellingPriceByProductId(idResult.data.productId, warehouseId, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
