import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import {
  previewOrder,
  addSalesOrder,
  getSalesOrders,
  getSalesOrder,
} from "./salesOrders.controller.js";
import approvalRoutes from "./salesOrders.approval.routes.js";
import warehouseRoutes from "./salesOrders.warehouse.routes.js";
import storekeeperRoutes from "./salesOrders.storekeeper.routes.js";
import driverRoutes from "./salesOrders.driver.routes.js";
import {
  previewSalesOrderSchema,
  createSalesOrderSchema,
  salesOrderQuerySchema,
  salesOrderIdSchema,
} from "./salesOrders.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/sales/orders/preview:
 *   post:
 *     tags: [10-sales]
 *     summary: Preview sales order quotation
 *     description: Calculate and return a quotation preview for the selected items. No order is created.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PreviewSalesOrderRequest'
 *     responses:
 *       200:
 *         description: Quotation preview calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PreviewSalesOrderResponse'
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
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer or product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/preview", validate(previewSalesOrderSchema), previewOrder);

/**
 * @swagger
 * /api/v1/sales/orders:
 *   post:
 *     tags: [10-sales]
 *     summary: Create sales order
 *     description: Create a new sales order after customer confirms the quotation. Backend recalculates all totals.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSalesOrderRequest'
 *     responses:
 *       201:
 *         description: Sales order created successfully
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
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer, product, or warehouse not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: No eligible sales representative available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", validate(createSalesOrderSchema), addSalesOrder);

/**
 * @swagger
 * /api/v1/sales/orders:
 *   get:
 *     tags: [10-sales]
 *     summary: List sales orders
 *     description: Retrieve a paginated list of sales orders with optional filtering.
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *       - in: query
 *         name: salesRepId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sales representative ID
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by warehouse ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of sales orders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginationResponse'
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
 */
router.get("/", validate(salesOrderQuerySchema), getSalesOrders);

/**
 * @swagger
 * /api/v1/sales/orders/{id}:
 *   get:
 *     tags: [10-sales]
 *     summary: Get sales order by ID
 *     description: Retrieve a single sales order by its ID.
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
 *         description: Sales order details
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
 *       401:
 *         description: Unauthorized
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
router.get("/:id", validate(salesOrderIdSchema), getSalesOrder);

router.use(approvalRoutes);
router.use("/warehouse", warehouseRoutes);
router.use("/storekeeper", storekeeperRoutes);
router.use("/driver", driverRoutes);

export default router;
