import { AppError } from "../../../utils/errors.js";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginatedSuccess,
} from "../../../utils/api-response.js";
import {
  productPriceQuerySchema,
  productPriceIdSchema,
  createProductPriceSchema,
  updateProductPriceSchema,
} from "./productPrices.validation.js";
import {
  listProductPrices,
  getProductPrice,
  createProductPrice,
  updateProductPrice,
  deleteProductPrice,
} from "./productPrices.service.js";

export async function listProductPricesHandler(req, res, next) {
  try {
    const q = productPriceQuerySchema.parse(req.query);
    const result = await listProductPrices(q);
    sendPaginatedSuccess(res, result.data, result.meta);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function getProductPriceHandler(req, res, next) {
  try {
    const { id } = productPriceIdSchema.parse(req.params);
    const result = await getProductPrice(id);
    sendSuccess(res, result);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function createProductPriceHandler(req, res, next) {
  try {
    const data = createProductPriceSchema.parse(req.body);
    const result = await createProductPrice(data, req.user);
    sendCreated(res, result);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function updateProductPriceHandler(req, res, next) {
  try {
    const { id } = productPriceIdSchema.parse(req.params);
    const data = updateProductPriceSchema.parse(req.body);
    const result = await updateProductPrice(id, data, req.user);
    sendSuccess(res, result);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function deleteProductPriceHandler(req, res, next) {
  try {
    const { id } = productPriceIdSchema.parse(req.params);
    await deleteProductPrice(id, req.user);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}