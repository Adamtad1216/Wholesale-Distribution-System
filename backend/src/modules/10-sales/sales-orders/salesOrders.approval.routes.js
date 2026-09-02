import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import {
  approveOrder,
  rejectOrder,
  requestAdjustmentOrder,
} from "./salesOrders.approval.controller.js";
import {
  approveSalesOrderSchema,
  rejectSalesOrderSchema,
  requestAdjustmentSchema,
  salesOrderActionIdSchema,
} from "./salesOrders.approval.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/sales/orders/{id}/approve:
 *   post:
 *     tags: [10-sales]
 *     summary: Approve sales order (Sales Rep only)
 *     description: Approve a sales order that is pending review.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sales order ID
 *     responses:
 *       200:
 *         description: Sales order approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/SalesOrderDetail'
 *       400:
 *         description: Validation error or invalid status transition
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
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sales order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:id/approve", requirePermission("sales_orders:update"), approveOrder);

/**
 * @swagger
 * /api/v1/sales/orders/{id}/reject:
 *   post:
 *     tags: [10-sales]
 *     summary: Reject sales order (Sales Rep only)
 *     description: Reject a sales order with a reason.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sales order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Sales order rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/SalesOrderDetail'
 *       400:
 *         description: Validation error or invalid status transition
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
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sales order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:id/reject", validate(rejectSalesOrderSchema), requirePermission("sales_orders:update"), rejectOrder);

/**
 * @swagger
 * /api/v1/sales/orders/{id}/request-adjustment:
 *   post:
 *     tags: [10-sales]
 *     summary: Request adjustment for sales order (Sales Rep only)
 *     description: Request an adjustment for a sales order with a reason.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sales order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Adjustment requested successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/SalesOrderDetail'
 *       400:
 *         description: Validation error or invalid status transition
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
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sales order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:id/request-adjustment", validate(requestAdjustmentSchema), requirePermission("sales_orders:update"), requestAdjustmentOrder);

export default router;
