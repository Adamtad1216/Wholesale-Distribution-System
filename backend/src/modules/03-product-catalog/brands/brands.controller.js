import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent, sendError } from "../../../utils/api-response.js";
import { brandIdSchema } from "./brands.validation.js";
import {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "./brands.service.js";

export async function listBrands(req, res, next) {
  try {
    const filters = { ...req.query };
    const { brands, meta } = await getBrands(filters);
    sendPaginatedSuccess(res, brands, meta);
  } catch (err) {
    next(err);
  }
}

export async function getBrand(req, res, next) {
  try {
    const idResult = brandIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid brand ID', 400);
    }
    const brand = await getBrandById(idResult.data.id);
    sendSuccess(res, brand);
  } catch (err) {
    next(err);
  }
}

export async function addBrand(req, res, next) {
  try {
    const brand = await createBrand(req.body, req.user.id, req);
    sendCreated(res, brand);
  } catch (err) {
    next(err);
  }
}

export async function modifyBrand(req, res, next) {
  try {
    const idResult = brandIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid brand ID', 400);
    }
    const brand = await updateBrand(idResult.data.id, req.body, req.user.id, req);
    sendSuccess(res, brand);
  } catch (err) {
    next(err);
  }
}

export async function removeBrand(req, res, next) {
  try {
    const idResult = brandIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid brand ID', 400);
    }
    await deleteBrand(idResult.data.id, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
