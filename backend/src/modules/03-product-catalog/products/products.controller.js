import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent, sendError } from "../../../utils/api-response.js";
import { productIdSchema } from "./products.validation.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addProductImage,
  removeProductImage,
  addPriceTier,
  updatePriceTier,
  removePriceTier,
  addDiscountRule,
  updateDiscountRule,
  removeDiscountRule,
} from "./products.service.js";

export async function listProducts(req, res, next) {
  try {
    const filters = { ...req.query };
    const { products, meta } = await getProducts(filters);
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

export async function addTier(req, res, next) {
  try {
    const idResult = productIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const tier = await addPriceTier(idResult.data.id, req.body, req.user.id, req);
    sendCreated(res, tier);
  } catch (err) {
    next(err);
  }
}

export async function modifyTier(req, res, next) {
  try {
    const idResult = productIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const tierIdResult = z.object({ tierId: z.string().uuid() }).safeParse({ tierId: req.params.tierId });
    if (!tierIdResult.success) {
      return sendError(res, 'Invalid tier ID', 400);
    }
    const tier = await updatePriceTier(idResult.data.id, tierIdResult.data.tierId, req.body, req.user.id, req);
    sendSuccess(res, tier);
  } catch (err) {
    next(err);
  }
}

export async function removeTier(req, res, next) {
  try {
    const idResult = productIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const tierIdResult = z.object({ tierId: z.string().uuid() }).safeParse({ tierId: req.params.tierId });
    if (!tierIdResult.success) {
      return sendError(res, 'Invalid tier ID', 400);
    }
    await removePriceTier(idResult.data.id, tierIdResult.data.tierId, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function addDiscount(req, res, next) {
  try {
    const idResult = productIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const rule = await addDiscountRule(idResult.data.id, req.body, req.user.id, req);
    sendCreated(res, rule);
  } catch (err) {
    next(err);
  }
}

export async function modifyDiscount(req, res, next) {
  try {
    const idResult = productIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const ruleIdResult = z.object({ ruleId: z.string().uuid() }).safeParse({ ruleId: req.params.ruleId });
    if (!ruleIdResult.success) {
      return sendError(res, 'Invalid rule ID', 400);
    }
    const rule = await updateDiscountRule(idResult.data.id, ruleIdResult.data.ruleId, req.body, req.user.id, req);
    sendSuccess(res, rule);
  } catch (err) {
    next(err);
  }
}

export async function removeDiscount(req, res, next) {
  try {
    const idResult = productIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid product ID', 400);
    }
    const ruleIdResult = z.object({ ruleId: z.string().uuid() }).safeParse({ ruleId: req.params.ruleId });
    if (!ruleIdResult.success) {
      return sendError(res, 'Invalid rule ID', 400);
    }
    await removeDiscountRule(idResult.data.id, ruleIdResult.data.ruleId, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
