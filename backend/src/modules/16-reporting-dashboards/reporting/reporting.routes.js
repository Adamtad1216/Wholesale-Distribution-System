import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import {
  getDashboard,
  getSalesReport,
  getProductSalesReport,
  getCustomerReport,
  getSalesRepReport,
  getOrderStatusReport,
  getWarehouseReport,
  getDeliveryReport,
} from "./reporting.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/reports/dashboard:
 *   get:
 *     tags: [16-reporting-dashboards]
 *     summary: Get dashboard summary metrics
 *     description: Returns high-level summary metrics including order counts by status, total customers, total products, and revenue figures.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/DashboardMetrics'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/dashboard",
  requirePermission("REPORT_VIEW_DASHBOARD"),
  getDashboard
);

/**
 * @swagger
 * /api/v1/reports/sales:
 *   get:
 *     tags: [16-reporting-dashboards]
 *     summary: Get sales report
 *     description: Returns aggregated sales/order information with optional filters for date range, sales representative, customer, product, and status.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering (inclusive)
 *       - in: query
 *         name: salesRepId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sales representative employee ID
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING_REVIEW, ADJUSTMENT_REQUIRED, APPROVED, REJECTED, RESERVED, READY_FOR_DELIVERY, PARTIALLY_FULFILLED, DELIVERED, COMPLETED, CANCELLED, SALES_REP_APPROVED, WAREHOUSE_PREPARATION_SCHEDULED, PREPARING, DELIVERY_SCHEDULED, OUT_FOR_DELIVERY]
 *         description: Filter by sales order status
 *     responses:
 *       200:
 *         description: Sales report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/SalesReport'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/sales",
  requirePermission("REPORT_VIEW_SALES"),
  getSalesReport
);

/**
 * @swagger
 * /api/v1/reports/sales/products:
 *   get:
 *     tags: [16-reporting-dashboards]
 *     summary: Get product sales report
 *     description: Returns aggregated product sales information grouped by product, including quantity sold and revenue. Supports pagination.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering orders (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering orders (inclusive)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product category ID
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Product sales report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductSalesItem'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/sales/products",
  requirePermission("REPORT_VIEW_PRODUCTS"),
  getProductSalesReport
);

/**
 * @swagger
 * /api/v1/reports/customers:
 *   get:
 *     tags: [16-reporting-dashboards]
 *     summary: Get customer report
 *     description: Returns aggregated customer information including order count and total purchase amount. Supports pagination and date filtering.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering orders (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering orders (inclusive)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Customer report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CustomerReportItem'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/customers",
  requirePermission("REPORT_VIEW_CUSTOMERS"),
  getCustomerReport
);

/**
 * @swagger
 * /api/v1/reports/sales-representatives:
 *   get:
 *     tags: [16-reporting-dashboards]
 *     summary: Get sales representative performance report
 *     description: Returns performance metrics per sales representative including assigned, approved, rejected, adjustment, delivered orders and sales amount. A Sales Representative can only view their own data.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering orders (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering orders (inclusive)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Sales representative report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SalesRepReportItem'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/sales-representatives",
  requirePermission("REPORT_VIEW_SALES_REPS"),
  getSalesRepReport
);

/**
 * @swagger
 * /api/v1/reports/orders/status:
 *   get:
 *     tags: [16-reporting-dashboards]
 *     summary: Get order status report
 *     description: Returns order counts grouped by sales order status.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Order status report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderStatusItem'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/orders/status",
  requirePermission("REPORT_VIEW_SALES"),
  getOrderStatusReport
);

/**
 * @swagger
 * /api/v1/reports/warehouse:
 *   get:
 *     tags: [16-reporting-dashboards]
 *     summary: Get warehouse preparation report
 *     description: Returns warehouse/preparation metrics including preparation task counts and prepared quantities.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Warehouse report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/WarehouseReport'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/warehouse",
  requirePermission("REPORT_VIEW_WAREHOUSE"),
  getWarehouseReport
);

/**
 * @swagger
 * /api/v1/reports/deliveries:
 *   get:
 *     tags: [16-reporting-dashboards]
 *     summary: Get delivery report
 *     description: Returns delivery metrics including total, completed, pending deliveries, status breakdown, and breakdown by driver. A Driver can only view their own deliveries.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering by scheduled date (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering by scheduled date (inclusive)
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver employee ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, DISPATCHED, IN_TRANSIT, DELIVERED, PARTIAL, FAILED, RETURNED, CANCELLED]
 *         description: Filter by delivery status
 *     responses:
 *       200:
 *         description: Delivery report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryReport'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/deliveries",
  requirePermission("REPORT_VIEW_DELIVERIES"),
  getDeliveryReport
);

export default router;
