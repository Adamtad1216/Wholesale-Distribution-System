import { AppError } from "../../../utils/errors.js";
import { sendSuccess, sendCreated } from "../../../utils/api-response.js";
import prisma from "../../../config/prisma.js";
import {
  previewSalesOrderSchema,
  createSalesOrderSchema,
} from "./salesOrders.validation.js";
import { previewSalesOrder, createSalesOrder } from "./salesOrders.service.js";

async function resolveCustomerFromUser(requestingUser) {
  const customer = await prisma.customer.findFirst({
    where: {
      isArchived: false,
      status: "ACTIVE",
      OR: [
        { personId: requestingUser.personId },
        {
          organization: {
            contacts: {
              some: { personId: requestingUser.personId, isPrimary: true },
            },
          },
        },
      ],
    },
    select: { id: true },
  });
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
      customerId = await resolveCustomerFromUser(req.user);
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

export async function getSalesOrders(req, res, next) {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
}

export async function getSalesOrder(req, res, next) {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
}