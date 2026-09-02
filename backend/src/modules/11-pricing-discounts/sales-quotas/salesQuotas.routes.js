import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import { validate } from "../../../middleware/validation.middleware.js";
import {
  salesQuotaQuerySchema,
  salesQuotaIdSchema,
  createSalesQuotaSchema,
  updateSalesQuotaSchema,
} from "./salesQuotas.validation.js";
import {
  listSalesQuotasHandler,
  getSalesQuotaHandler,
  createSalesQuotaHandler,
  updateSalesQuotaHandler,
  deleteSalesQuotaHandler,
  getQuotaConsumptionHandler,
} from "./salesQuotas.controller.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/v1/pricing/quotas:
 *   get:
 *     tags: [11-pricing-discounts]
 *     summary: List Sales Quotas
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: warehouseId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: priceTierId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, ACTIVE, INACTIVE, EXPIRED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: List of sales quotas }
 */
router.get(
  "/",
  validate(salesQuotaQuerySchema),
  requirePermission("QUOTA_VIEW"),
  listSalesQuotasHandler,
);

/**
 * @swagger
 * /api/v1/pricing/quotas/consumption:
 *   get:
 *     tags: [11-pricing-discounts]
 *     summary: Get quota consumption for a customer
 *     description: Returns live consumption of quotas applicable to a customer/product/warehouse combination, computed from SalesQuotaUsage and SalesOrders.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: warehouseId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: priceTierId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Quota consumption report }
 */
router.get(
  "/consumption",
  requirePermission("QUOTA_VIEW"),
  getQuotaConsumptionHandler,
);

/**
 * @swagger
 * /api/v1/pricing/quotas/{id}:
 *   get:
 *     tags: [11-pricing-discounts]
 *     summary: Get Sales Quota
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Quota details }
 *       404: { description: Not found }
 */
router.get(
  "/:id",
  requirePermission("QUOTA_VIEW"),
  getSalesQuotaHandler,
);

/**
 * @swagger
 * /api/v1/pricing/quotas:
 *   post:
 *     tags: [11-pricing-discounts]
 *     summary: Create Sales Quota
 *     description: |
 *       Create a new sales quota. Quotas scope one or more dimensions:
 *       Customer, Product, Price Tier, Warehouse, Branch. Consumption is
 *       tracked separately per Warehouse for each customer/product.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, maxQuantity, startsAt, endsAt]
 *             properties:
 *               name: { type: string, example: "Bole Supermarket Coca-Cola monthly quota" }
 *               customerId: { type: string, format: uuid }
 *               productId: { type: string, format: uuid }
 *               priceTierId: { type: string, format: uuid }
 *               warehouseId: { type: string, format: uuid }
 *               branchId: { type: string, format: uuid }
 *               maxQuantity: { type: number, example: 1000 }
 *               period: { type: string, enum: [DAILY, WEEKLY, MONTHLY, YEARLY] }
 *               startsAt: { type: string, format: date-time }
 *               endsAt: { type: string, format: date-time }
 *               status: { type: string, enum: [DRAFT, ACTIVE, INACTIVE, EXPIRED] }
 *     responses:
 *       201: { description: Created }
 */
router.post(
  "/",
  validate(createSalesQuotaSchema),
  requirePermission("QUOTA_CREATE"),
  createSalesQuotaHandler,
);

/**
 * @swagger
 * /api/v1/pricing/quotas/{id}:
 *   patch:
 *     tags: [11-pricing-discounts]
 *     summary: Update Sales Quota
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               customerId: { type: string, format: uuid, nullable: true }
 *               productId: { type: string, format: uuid, nullable: true }
 *               priceTierId: { type: string, format: uuid, nullable: true }
 *               warehouseId: { type: string, format: uuid, nullable: true }
 *               branchId: { type: string, format: uuid, nullable: true }
 *               maxQuantity: { type: number }
 *               period: { type: string, enum: [DAILY, WEEKLY, MONTHLY, YEARLY] }
 *               startsAt: { type: string, format: date-time }
 *               endsAt: { type: string, format: date-time }
 *               status: { type: string, enum: [DRAFT, ACTIVE, INACTIVE, EXPIRED] }
 *     responses:
 *       200: { description: Updated }
 */
router.patch(
  "/:id",
  validate(updateSalesQuotaSchema),
  requirePermission("QUOTA_UPDATE"),
  updateSalesQuotaHandler,
);

/**
 * @swagger
 * /api/v1/pricing/quotas/{id}:
 *   delete:
 *     tags: [11-pricing-discounts]
 *     summary: Delete Sales Quota
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Deleted }
 */
router.delete(
  "/:id",
  requirePermission("QUOTA_DELETE"),
  deleteSalesQuotaHandler,
);

export default router;