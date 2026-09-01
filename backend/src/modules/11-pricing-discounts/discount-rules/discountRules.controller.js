import { AppError } from "../../../utils/errors.js";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginatedSuccess,
} from "../../../utils/api-response.js";
import {
  discountRuleQuerySchema,
  discountRuleIdSchema,
  createDiscountRuleSchema,
  updateDiscountRuleSchema,
} from "./discountRules.validation.js";
import {
  listDiscountRules,
  getDiscountRule,
  createDiscountRule,
  updateDiscountRule,
  deleteDiscountRule,
} from "./discountRules.service.js";

export async function listDiscountRulesHandler(req, res, next) {
  try {
    const q = discountRuleQuerySchema.parse(req.query);
    const result = await listDiscountRules(q);
    sendPaginatedSuccess(res, result.data, result.meta);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function getDiscountRuleHandler(req, res, next) {
  try {
    const { id } = discountRuleIdSchema.parse(req.params);
    const result = await getDiscountRule(id);
    sendSuccess(res, result);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function createDiscountRuleHandler(req, res, next) {
  try {
    const data = createDiscountRuleSchema.parse(req.body);
    const result = await createDiscountRule(data, req.user);
    sendCreated(res, result);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function updateDiscountRuleHandler(req, res, next) {
  try {
    const { id } = discountRuleIdSchema.parse(req.params);
    const data = updateDiscountRuleSchema.parse(req.body);
    const result = await updateDiscountRule(id, data, req.user);
    sendSuccess(res, result);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function deleteDiscountRuleHandler(req, res, next) {
  try {
    const { id } = discountRuleIdSchema.parse(req.params);
    await deleteDiscountRule(id, req.user);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}