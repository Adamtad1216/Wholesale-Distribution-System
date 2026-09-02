import { AppError } from "../../../utils/errors.js";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginatedSuccess,
} from "../../../utils/api-response.js";
import prisma from "../../../config/prisma.js";
import {
  salesQuotaQuerySchema,
  salesQuotaIdSchema,
  createSalesQuotaSchema,
  updateSalesQuotaSchema,
} from "./salesQuotas.validation.js";
import {
  listSalesQuotas,
  getSalesQuota,
  createSalesQuota,
  updateSalesQuota,
  deleteSalesQuota,
  getQuotaConsumptionForCustomer,
} from "./salesQuotas.service.js";

export async function listSalesQuotasHandler(req, res, next) {
  try {
    const q = salesQuotaQuerySchema.parse(req.query);
    const result = await listSalesQuotas(q);
    sendPaginatedSuccess(res, result.data, result.meta);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function getSalesQuotaHandler(req, res, next) {
  try {
    const { id } = salesQuotaIdSchema.parse(req.params);
    const result = await getSalesQuota(id);
    sendSuccess(res, result);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function createSalesQuotaHandler(req, res, next) {
  try {
    const data = createSalesQuotaSchema.parse(req.body);
    const result = await createSalesQuota(data, req.user);
    sendCreated(res, result);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function updateSalesQuotaHandler(req, res, next) {
  try {
    const { id } = salesQuotaIdSchema.parse(req.params);
    const data = updateSalesQuotaSchema.parse(req.body);
    const result = await updateSalesQuota(id, data, req.user);
    sendSuccess(res, result);
  } catch (err) {
    if (err.name === "ZodError") return next(new AppError("Validation failed: " + err.message, 400));
    next(err);
  }
}

export async function deleteSalesQuotaHandler(req, res, next) {
  try {
    const { id } = salesQuotaIdSchema.parse(req.params);
    await deleteSalesQuota(id, req.user);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function getQuotaConsumptionHandler(req, res, next) {
  try {
    const customerId = req.query.customerId;
    if (!customerId) return next(new AppError("customerId query parameter is required", 400));
    const productId = req.query.productId || undefined;
    const warehouseId = req.query.warehouseId || undefined;
    const priceTierId = req.query.priceTierId || undefined;

    const isCustomerRole = req.user.userRoles.some((ur) => ur.role.name === "CUSTOMER");
    if (isCustomerRole) {
      const own = await prisma.customer.findFirst({
        where: {
          isArchived: false,
          OR: [
            { personId: req.user.personId },
            {
              organization: {
                contacts: { some: { personId: req.user.personId, isPrimary: true } },
              },
            },
          ],
        },
        select: { id: true },
      });
      if (!own || own.id !== customerId) {
        return next(new AppError("Customers can only view their own quota consumption", 403));
      }
    }

    const data = await getQuotaConsumptionForCustomer({ customerId, productId, warehouseId, priceTierId });
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}