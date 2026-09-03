import {
  sendSuccess,
  sendPaginatedSuccess,
  sendError,
} from "../../utils/api-response.js";
import { productIdSchema, productQuerySchema } from "./products.validation.js";
import { getProducts, getProductById } from "./products.service.js";

export async function listProducts(req, res, next) {
  try {
    const { products, meta } = await getProducts(req.query);
    sendPaginatedSuccess(res, products, meta);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const idResult = productIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, "Invalid product ID", 400);
    }
    const product = await getProductById(idResult.data.id);
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
}
