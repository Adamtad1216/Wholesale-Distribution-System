import { sendSuccess } from "../../../utils/api-response.js";
import { AppError } from "../../../utils/errors.js";
import {
  approveSalesOrder,
  rejectSalesOrder,
  requestAdjustment,
} from "./salesOrders.approval.service.js";
import {
  approveSalesOrderSchema,
  rejectSalesOrderSchema,
  requestAdjustmentSchema,
  salesOrderActionIdSchema,
} from "./salesOrders.approval.validation.js";

export async function approveOrder(req, res, next) {
  try {
    const paramsResult = salesOrderActionIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: paramsResult.error.flatten().fieldErrors,
      }, 400);
    }

    const salesOrder = await approveSalesOrder(req.params.id, req.user.id, req.user.userRoles);
    sendSuccess(res, salesOrder);
  } catch (err) {
    next(err);
  }
}

export async function rejectOrder(req, res, next) {
  try {
    const paramsResult = salesOrderActionIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: paramsResult.error.flatten().fieldErrors,
      }, 400);
    }

    const bodyResult = rejectSalesOrderSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: bodyResult.error.flatten().fieldErrors,
      }, 400);
    }

    const salesOrder = await rejectSalesOrder(req.params.id, req.user.id, req.user.userRoles, bodyResult.data.reason);
    sendSuccess(res, salesOrder);
  } catch (err) {
    next(err);
  }
}

export async function requestAdjustmentOrder(req, res, next) {
  try {
    const paramsResult = salesOrderActionIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: paramsResult.error.flatten().fieldErrors,
      }, 400);
    }

    const bodyResult = requestAdjustmentSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: bodyResult.error.flatten().fieldErrors,
      }, 400);
    }

    const salesOrder = await requestAdjustment(req.params.id, req.user.id, req.user.userRoles, bodyResult.data.reason);
    sendSuccess(res, salesOrder);
  } catch (err) {
    next(err);
  }
}
