import { AppError } from "../../../utils/errors.js";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginatedSuccess,
} from "../../../utils/api-response.js";
import {
  priceTierQuerySchema,
  priceTierIdSchema,
  createPriceTierSchema,
  updatePriceTierSchema,
  setPriceTierStatusSchema,
} from "./priceTiers.validation.js";
import {
  listPriceTiers,
  getPriceTier,
  createPriceTier,
  updatePriceTier,
  setPriceTierActive,
  archivePriceTier,
} from "./priceTiers.service.js";

export async function listPriceTiersHandler(req, res, next) {
  try {
    const q = priceTierQuerySchema.parse(req.query);
    const result = await listPriceTiers(q);
    sendPaginatedSuccess(res, result.data, result.meta);
  } catch (err) {
    if (err.name === "ZodError") {
      return next(new AppError("Validation failed: " + err.message, 400));
    }
    next(err);
  }
}

export async function getPriceTierHandler(req, res, next) {
  try {
    const { id } = priceTierIdSchema.parse(req.params);
    const pt = await getPriceTier(id);
    sendSuccess(res, pt);
  } catch (err) {
    if (err.name === "ZodError") {
      return next(new AppError("Validation failed: " + err.message, 400));
    }
    next(err);
  }
}

export async function createPriceTierHandler(req, res, next) {
  try {
    const data = createPriceTierSchema.parse(req.body);
    const pt = await createPriceTier(data, req.user);
    sendCreated(res, pt);
  } catch (err) {
    if (err.name === "ZodError") {
      return next(new AppError("Validation failed: " + err.message, 400));
    }
    next(err);
  }
}

export async function updatePriceTierHandler(req, res, next) {
  try {
    const { id } = priceTierIdSchema.parse(req.params);
    const data = updatePriceTierSchema.parse(req.body);
    const pt = await updatePriceTier(id, data, req.user);
    sendSuccess(res, pt);
  } catch (err) {
    if (err.name === "ZodError") {
      return next(new AppError("Validation failed: " + err.message, 400));
    }
    next(err);
  }
}

export async function activatePriceTierHandler(req, res, next) {
  try {
    const { id } = priceTierIdSchema.parse(req.params);
    const pt = await setPriceTierActive(id, true, req.user);
    sendSuccess(res, pt);
  } catch (err) {
    next(err);
  }
}

export async function deactivatePriceTierHandler(req, res, next) {
  try {
    const { id } = priceTierIdSchema.parse(req.params);
    const pt = await setPriceTierActive(id, false, req.user);
    sendSuccess(res, pt);
  } catch (err) {
    next(err);
  }
}

export async function setPriceTierStatusHandler(req, res, next) {
  try {
    const { id } = priceTierIdSchema.parse(req.params);
    const { status } = setPriceTierStatusSchema.parse(req.body);
    const pt = await updatePriceTier(id, { status }, req.user);
    sendSuccess(res, pt);
  } catch (err) {
    if (err.name === "ZodError") {
      return next(new AppError("Validation failed: " + err.message, 400));
    }
    next(err);
  }
}

export async function deletePriceTierHandler(req, res, next) {
  try {
    const { id } = priceTierIdSchema.parse(req.params);
    await archivePriceTier(id, req.user);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}