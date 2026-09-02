import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent, sendError } from "../../../utils/api-response.js";
import { z } from "zod";
import { productIdSchema } from "./products.validation.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addProductImage,
  removeProductImage,
} from "./products.service.js";

export async function listProducts(req, res, next) {
  try {
    const filters = { ...req.query };
    const { products, meta } = await getProducts(filters, req.user);
    sendPaginatedSuccess(res, products, meta);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const idResult = productIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const product = await getProductById(idResult.data.id);
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
}

export async function addProduct(req, res, next) {
  try {
    const product = await createProduct(req.body, req.user.id, req);
    sendCreated(res, product);
  } catch (err) {
    next(err);
  }
}

export async function modifyProduct(req, res, next) {
  try {
    const idResult = productIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const product = await updateProduct(idResult.data.id, req.body, req.user.id, req);
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
}

export async function removeProduct(req, res, next) {
  try {
    const idResult = productIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    await deleteProduct(idResult.data.id, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function addImage(req, res, next) {
  try {
    const idResult = productIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const image = await addProductImage(idResult.data.id, req.body, req.user.id, req);
    sendCreated(res, image);
  } catch (err) {
    next(err);
  }
}

export async function removeImage(req, res, next) {
  try {
    const idResult = productIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const imageIdResult = z.object({ imageId: z.string().uuid() }).safeParse({ imageId: req.params.imageId });
    if (!imageIdResult.success) {
      return sendError(res, 'Invalid image ID', 400);
    }
    await removeProductImage(idResult.data.id, imageIdResult.data.imageId, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
