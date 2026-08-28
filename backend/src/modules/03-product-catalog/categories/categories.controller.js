import { sendSuccess, sendPaginatedSuccess, sendCreated, sendError, sendDeleted, sendUpdated } from "../../../utils/api-response.js";
import { categoryIdSchema } from "./categories.validation.js";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "./categories.service.js";

export async function listCategories(req, res, next) {
  try {
    const filters = { ...req.query };
    const { categories, meta } = await getCategories(filters);
    sendPaginatedSuccess(res, categories, meta);
  } catch (err) {
    next(err);
  }
}

export async function getCategory(req, res, next) {
  try {
    const idResult = categoryIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid category ID', 400);
    }
    const category = await getCategoryById(idResult.data.id);
    sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
}

export async function addCategory(req, res, next) {
  try {
    const category = await createCategory(req.body, req.user.id, req);
    sendCreated(res, category);
  } catch (err) {
    next(err);
  }
}

export async function modifyCategory(req, res, next) {
  try {
    const idResult = categoryIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid category ID', 400);
    }
    const category = await updateCategory(idResult.data.id, req.body, req.user.id, req);
    sendUpdated(res, category, 'Category updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function removeCategory(req, res, next) {
  try {
    const idResult = categoryIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid category ID', 400);
    }
    await deleteCategory(idResult.data.id, req.user.id, req);
    sendDeleted(res, 'Category deleted successfully');
  } catch (err) {
    next(err);
  }
}
