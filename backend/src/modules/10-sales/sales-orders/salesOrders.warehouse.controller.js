import { sendSuccess, sendPaginatedSuccess } from "../../../utils/api-response.js";
import { AppError } from "../../../utils/errors.js";
import {
  getApprovedOrders as getApprovedOrdersService,
  schedulePreparation as schedulePreparationService,
  scheduleDelivery as scheduleDeliveryService,
  confirmCustomerPickup as confirmPickupService,
  confirmCustomerPickupReceipt as confirmCustomerPickupReceiptService,
} from "./salesOrders.warehouse.service.js";
import {
  warehouseQuerySchema,
  salesOrderActionIdSchema,
  schedulePreparationSchema,
  scheduleDeliverySchema,
} from "./salesOrders.warehouse.validation.js";
import { confirmPickupSchema, confirmCustomerPickupReceiptSchema } from "./salesOrders.validation.js";

export async function getApprovedOrders(req, res, next) {
  try {
    const queryResult = warehouseQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: queryResult.error.flatten().fieldErrors,
      }, 400);
    }

    const result = await getApprovedOrdersService(queryResult.data, req.user);
    sendPaginatedSuccess(res, result.items, result.pagination);
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

    const order = await schedulePreparationService(req.params.id, bodyResult.data, req.user);
    sendSuccess(res, order);
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
    sendSuccess(res, delivery, 201);
  } catch (err) {
    next(err);
  }
}

export async function confirmPickup(req, res, next) {
  try {
    const paramsResult = salesOrderActionIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: paramsResult.error.flatten().fieldErrors,
      }, 400);
    }

    const bodyResult = confirmPickupSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: bodyResult.error.flatten().fieldErrors,
      }, 400);
    }

    const order = await confirmPickupService(req.params.id, bodyResult.data, req.user);
    sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
}

export async function confirmCustomerPickupReceipt(req, res, next) {
  try {
    const paramsResult = salesOrderActionIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: paramsResult.error.flatten().fieldErrors,
      }, 400);
    }

    const bodyResult = confirmCustomerPickupReceiptSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return sendSuccess(res, {
        message: "Validation failed",
        errors: bodyResult.error.flatten().fieldErrors,
      }, 400);
    }

    const order = await confirmCustomerPickupReceiptService(req.params.id, bodyResult.data, req.user);
    sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
}
