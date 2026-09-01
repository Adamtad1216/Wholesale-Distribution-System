import { sendSuccess } from "../../../utils/api-response.js";
import { AppError } from "../../../utils/errors.js";
import {
  getApprovedOrders as getApprovedOrdersService,
  schedulePreparation as schedulePreparationService,
  scheduleDelivery as scheduleDeliveryService,
} from "./salesOrders.warehouse.service.js";
import {
  warehouseQuerySchema,
  salesOrderActionIdSchema,
  schedulePreparationSchema,
  scheduleDeliverySchema,
} from "./salesOrders.warehouse.validation.js";

export async function getApprovedOrders(req, res, next) {
  try {
    const queryResult = warehouseQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: queryResult.error.flatten().fieldErrors,
      }, 400);
    }

    const data = await getApprovedOrdersService(queryResult.data, req.user);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function schedulePreparation(req, res, next) {
  try {
    const paramsResult = salesOrderActionIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: paramsResult.error.flatten().fieldErrors,
      }, 400);
    }

    const bodyResult = schedulePreparationSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: bodyResult.error.flatten().fieldErrors,
      }, 400);
    }

    const task = await schedulePreparationService(req.params.id, bodyResult.data, req.user);
    sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
}

export async function scheduleDelivery(req, res, next) {
  try {
    const paramsResult = salesOrderActionIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: paramsResult.error.flatten().fieldErrors,
      }, 400);
    }

    const bodyResult = scheduleDeliverySchema.safeParse(req.body);
    if (!bodyResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: bodyResult.error.flatten().fieldErrors,
      }, 400);
    }

    const delivery = await scheduleDeliveryService(req.params.id, bodyResult.data, req.user);
    sendSuccess(res, delivery);
  } catch (err) {
    next(err);
  }
}
