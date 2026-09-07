import { AppError } from "../../../utils/errors.js";
import { sendSuccess, sendCreated, sendPaginatedSuccess } from "../../../utils/api-response.js";
import prisma from "../../../config/prisma.js";
import {
  previewSalesOrderSchema,
  createSalesOrderSchema,
  createSalesRepOrderSchema,
} from "./salesOrders.validation.js";
import { previewSalesOrder, createSalesOrder, createSalesRepOrder, listSalesOrders } from "./salesOrders.service.js";
import { getSalesOrderWithHistory } from "./salesOrders.status.service.js";

async function resolveCustomerFromUser(requestingUser) {
  let customer = await prisma.customer.findFirst({
    where: {
      isArchived: false,
      status: "ACTIVE",
      OR: [
        { personId: requestingUser.personId },
        {
          organization: {
            contacts: {
              some: { personId: requestingUser.personId },
            },
          },
        },
        { createdById: requestingUser.id },
      ],
    },
    select: { id: true },
  });

  if (!customer) {
    customer = await prisma.customer.findFirst({
      where: { isArchived: false },
      select: { id: true },
    });
  }

  if (!customer) {
    throw new AppError(
      "Customer profile not found or inactive. Please contact support.",
      404,
    );
  }
  return customer.id;
}

export async function previewOrder(req, res, next) {
  try {
    const bodyResult = previewSalesOrderSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: bodyResult.error.flatten().fieldErrors,
      });
    }

    let customerId = bodyResult.data.customerId;
    if (!customerId) {
      try {
        customerId = await resolveCustomerFromUser(req.user);
      } catch {
        customerId = null;
      }
    }

    const preview = await previewSalesOrder({
      items: bodyResult.data.items,
      customerId,
      warehouseId: bodyResult.data.warehouseId,
      requestingUser: req.user,
    });
    sendSuccess(res, preview);
  } catch (err) {
    next(err);
  }
}

export async function addSalesOrder(req, res, next) {
  try {
    const bodyResult = createSalesOrderSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: bodyResult.error.flatten().fieldErrors,
      });
    }

    const customerId = await resolveCustomerFromUser(req.user);

    const salesOrder = await createSalesOrder({
      customerId,
      warehouseId: bodyResult.data.warehouseId,
      items: bodyResult.data.items,
      requiredDate: bodyResult.data.requiredDate,
      deliveryLocation: bodyResult.data.deliveryLocation,
      requestingUser: req.user,
    });
    sendCreated(res, salesOrder);
  } catch (err) {
    next(err);
  }
}

export async function addSalesRepOrder(req, res, next) {
  try {
    const bodyResult = createSalesRepOrderSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: bodyResult.error.flatten().fieldErrors,
      });
    }

    const salesOrder = await createSalesRepOrder({
      customerId: bodyResult.data.customerId,
      newCustomer: bodyResult.data.newCustomer,
      warehouseId: bodyResult.data.warehouseId,
      items: bodyResult.data.items,
      requiredDate: bodyResult.data.requiredDate,
      deliveryLocation: bodyResult.data.deliveryLocation,
      requestingUser: req.user,
    });
    sendCreated(res, salesOrder);
  } catch (err) {
    next(err);
  }
}

export async function getSalesOrders(req, res, next) {
  try {
    const result = await listSalesOrders(req.query, req.user);
    sendPaginatedSuccess(res, result.data, result.meta);
  } catch (err) {
    next(err);
  }
}

export async function getSalesOrder(req, res, next) {
  try {
    const salesOrder = await getSalesOrderWithHistory(req.params.id);
    sendSuccess(res, salesOrder);
  } catch (err) {
    next(err);
  }
}