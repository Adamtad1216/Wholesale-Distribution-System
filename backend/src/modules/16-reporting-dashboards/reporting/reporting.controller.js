import { sendSuccess, sendPaginatedSuccess } from "../../../utils/api-response.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";
import {
  getDashboardMetrics as getServiceDashboard,
  getSalesReport as getServiceSalesReport,
  getProductSalesReport as getServiceProductSales,
  getCustomerReport as getServiceCustomerReport,
  getSalesRepReport as getServiceSalesRepReport,
  getOrderStatusReport as getServiceOrderStatus,
  getWarehouseReport as getServiceWarehouse,
  getDeliveryReport as getServiceDelivery,
} from "./reporting.service.js";
import {
  dashboardQuerySchema,
  salesReportQuerySchema,
  productSalesQuerySchema,
  customerReportQuerySchema,
  salesRepReportQuerySchema,
  orderStatusQuerySchema,
  warehouseReportQuerySchema,
  deliveryReportQuerySchema,
} from "./reporting.validation.js";

function parseQuery(schema, query) {
  const result = schema.safeParse(query);
  if (!result.success) {
    return { ok: false, errors: result.error.flatten().fieldErrors };
  }
  return { ok: true, data: result.data };
}

export async function getDashboard(req, res, next) {
  try {
    const parsed = parseQuery(dashboardQuerySchema, req.query);
    if (!parsed.ok) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.errors,
      });
    }
    const metrics = await getServiceDashboard();
    sendSuccess(res, metrics);
  } catch (err) {
    next(err);
  }
}

export async function getSalesReport(req, res, next) {
  try {
    const parsed = parseQuery(salesReportQuerySchema, req.query);
    if (!parsed.ok) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.errors,
      });
    }
    const report = await getServiceSalesReport(parsed.data);
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}

export async function getProductSalesReport(req, res, next) {
  try {
    const parsed = parseQuery(productSalesQuerySchema, req.query);
    if (!parsed.ok) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.errors,
      });
    }
    const { page, limit } = getPaginationParams(parsed.data);
    const { data, total } = await getServiceProductSales({
      ...parsed.data,
      page,
      limit,
    });
    const meta = buildPaginationMeta({ page, limit, total });
    sendPaginatedSuccess(res, data, meta);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerReport(req, res, next) {
  try {
    const parsed = parseQuery(customerReportQuerySchema, req.query);
    if (!parsed.ok) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.errors,
      });
    }
    const { page, limit } = getPaginationParams(parsed.data);
    const { data, total } = await getServiceCustomerReport({
      ...parsed.data,
      page,
      limit,
    });
    const meta = buildPaginationMeta({ page, limit, total });
    sendPaginatedSuccess(res, data, meta);
  } catch (err) {
    next(err);
  }
}

export async function getSalesRepReport(req, res, next) {
  try {
    const parsed = parseQuery(salesRepReportQuerySchema, req.query);
    if (!parsed.ok) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.errors,
      });
    }
    const { page, limit } = getPaginationParams(parsed.data);
    const { data, total } = await getServiceSalesRepReport(
      { ...parsed.data, page, limit },
      req.user
    );
    const meta = buildPaginationMeta({ page, limit, total });
    sendPaginatedSuccess(res, data, meta);
  } catch (err) {
    next(err);
  }
}

export async function getOrderStatusReport(req, res, next) {
  try {
    const parsed = parseQuery(orderStatusQuerySchema, req.query);
    if (!parsed.ok) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.errors,
      });
    }
    const report = await getServiceOrderStatus();
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}

export async function getWarehouseReport(req, res, next) {
  try {
    const parsed = parseQuery(warehouseReportQuerySchema, req.query);
    if (!parsed.ok) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.errors,
      });
    }
    const report = await getServiceWarehouse();
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}

export async function getDeliveryReport(req, res, next) {
  try {
    const parsed = parseQuery(deliveryReportQuerySchema, req.query);
    if (!parsed.ok) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: parsed.errors,
      });
    }
    const report = await getServiceDelivery(parsed.data, req.user);
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}
