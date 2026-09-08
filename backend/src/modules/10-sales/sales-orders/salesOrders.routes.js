import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import {
  previewOrder,
  addSalesOrder,
  addSalesRepOrder,
  getSalesOrders,
  getSalesOrder,
} from "./salesOrders.controller.js";
import approvalRoutes from "./salesOrders.approval.routes.js";
import warehouseRoutes from "./salesOrders.warehouse.routes.js";
import storekeeperRoutes from "./salesOrders.storekeeper.routes.js";
import driverRoutes from "./salesOrders.driver.routes.js";
import prisma from "../../../config/prisma.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { confirmCustomerHandover } from "./salesOrders.handover.service.js";
import { completeDelivery } from "./salesOrders.driver.service.js";
import { confirmCustomerPickup, confirmCustomerPickupReceipt } from "./salesOrders.warehouse.service.js";
import {
  previewSalesOrderSchema,
  createSalesOrderSchema,
  createSalesRepOrderSchema,
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
 * /api/v1/sales/orders/sales-rep:
 *   post:
 *     tags: [10-sales]
 *     summary: Create sales order on behalf of a customer (Sales Rep)
 *     description: |
 *       Sales representatives and admins use this endpoint to create orders on behalf of a customer.
 *       Provide either an existing `customerId` or inline `newCustomer` data to create a new customer inline.
 *
 *       **Existing customer**: Send `customerId` (UUID) to reference an existing customer.
 *
 *       **New customer (Person)**: Send `newCustomer` with `customerType: "PERSON"` and `person` details.
 *
 *       **New customer (Organization)**: Send `newCustomer` with `customerType: "ORGANIZATION"` and `organization` details.
 *
 *       No user/login account is created for inline customers.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, items]
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *                 description: Existing customer ID (use this OR newCustomer)
 *               newCustomer:
 *                 type: object
 *                 description: Inline new customer data (use this OR customerId)
 *                 properties:
 *                   customerType:
 *                     type: string
 *                     enum: [PERSON, ORGANIZATION]
 *                   person:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       middleName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       address:
 *                         type: string
 *                   organization:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       registrationNumber:
 *                         type: string
 *                       taxNumber:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       address:
 *                         type: string
 *                       contacts:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                             phone:
 *                               type: string
 *                             email:
 *                               type: string
 *                             isPrimary:
 *                               type: boolean
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               requiredDate:
 *                 type: string
 *                 format: date-time
 *               deliveryLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   addressText:
 *                     type: string
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *           examples:
 *             existingCustomer:
 *               summary: Order for existing customer
 *               value:
 *                 customerId: "550e8400-e29b-41d4-a716-446655440000"
 *                 warehouseId: "550e8400-e29b-41d4-a716-446655440001"
 *                 items:
 *                   - productId: "550e8400-e29b-41d4-a716-446655440002"
 *                     quantity: 10
 *             newPerson:
 *               summary: Order with new person customer
 *               value:
 *                 newCustomer:
 *                   customerType: "PERSON"
 *                   person:
 *                     firstName: "Abebe"
 *                     lastName: "Kebede"
 *                     phone: "+251911111111"
 *                     email: "abebe@example.com"
 *                 warehouseId: "550e8400-e29b-41d4-a716-446655440001"
 *                 items:
 *                   - productId: "550e8400-e29b-41d4-a716-446655440002"
 *                     quantity: 5
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Warehouse, customer, or employee not found
 *       409:
 *         description: Duplicate email or registration number
 */
router.post("/sales-rep", validate(createSalesRepOrderSchema), addSalesRepOrder);

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

router.post(
  "/:id/customer-confirm-handover",
  validate(salesOrderIdSchema),
  async (req, res, next) => {
    try {
      const result = await confirmCustomerHandover(req.params.id, req.body, req.user);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/driver-confirm-handover",
  validate(salesOrderIdSchema),
  async (req, res, next) => {
    try {
      const salesOrder = await prisma.salesOrder.findUnique({
        where: { id: req.params.id },
        include: {
          deliveries: {
            where: { isArchived: false },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
      if (!salesOrder || !salesOrder.deliveries?.[0]) {
        return res.status(404).json({ status: "error", message: "Delivery not found for this sales order" });
      }
      const result = await completeDelivery(salesOrder.deliveries[0].id, req.body.proof || req.body, req.user);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/confirm-pickup",
  validate(salesOrderIdSchema),
  async (req, res, next) => {
    try {
      const result = await confirmCustomerPickup(req.params.id, req.body, req.user);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/customer-pickup-confirm",
  validate(salesOrderIdSchema),
  async (req, res, next) => {
    try {
      const result = await confirmCustomerPickupReceipt(req.params.id, req.body, req.user);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

router.use(approvalRoutes);
router.use("/warehouse", warehouseRoutes);
router.use("/storekeeper", storekeeperRoutes);
router.use("/driver", driverRoutes);

export default router;
