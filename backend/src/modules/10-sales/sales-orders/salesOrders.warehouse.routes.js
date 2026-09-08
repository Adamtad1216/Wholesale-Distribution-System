import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import {
  getApprovedOrders,
  schedulePreparation,
  scheduleDelivery,
  confirmPickup,
  confirmCustomerPickupReceipt,
} from "./salesOrders.warehouse.controller.js";
import {
  warehouseQuerySchema,
  salesOrderActionIdSchema,
  schedulePreparationSchema,
  scheduleDeliverySchema,
} from "./salesOrders.warehouse.validation.js";
import { confirmPickupSchema, confirmCustomerPickupReceiptSchema } from "./salesOrders.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";

import prisma from "../../../config/prisma.js";
import { sendSuccess } from "../../../utils/api-response.js";

const router = Router();

router.use(authenticate);

router.get("/storekeepers", async (req, res, next) => {
  try {
    const storekeepers = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        isArchived: false,
        OR: [
          {
            person: {
              user: {
                userRoles: {
                  some: {
                    role: {
                      name: { in: ["STORE_KEEPER", "STOREKEEPER"] },
                    },
                  },
                },
              },
            },
          },
          {
            department: { contains: "Store", mode: "insensitive" },
          },
        ],
      },
      include: { person: true },
      orderBy: { employeeCode: "asc" },
    });
    sendSuccess(res, storekeepers);
  } catch (err) {
    next(err);
  }
});

router.get("/drivers", async (req, res, next) => {
  try {
    const drivers = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        isArchived: false,
        OR: [
          {
            person: {
              user: {
                userRoles: {
                  some: {
                    role: {
                      name: "DRIVER",
                    },
                  },
                },
              },
            },
          },
          {
            driverLicenseNumber: { not: null },
          },
        ],
      },
      include: { person: true },
      orderBy: { employeeCode: "asc" },
    });
    sendSuccess(res, drivers);
  } catch (err) {
    next(err);
  }
});

router.get("/vehicles", async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: "ACTIVE", isArchived: false },
      orderBy: { plateNumber: "asc" },
    });
    sendSuccess(res, vehicles);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/v1/sales/orders/warehouse/approved:
 *   get:
 *     tags: [10-sales]
 *     summary: Get approved sales orders for warehouse manager
 *     description: Retrieve approved sales orders ready for warehouse preparation.
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
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by warehouse ID
 *     responses:
 *       200:
 *         description: Approved sales orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
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
router.get("/approved", validate(warehouseQuerySchema), requirePermission("sales_orders:read"), getApprovedOrders);

/**
 * @swagger
 * /api/v1/sales/orders/{id}/schedule-preparation:
 *   post:
 *     tags: [10-sales]
 *     summary: Schedule preparation for approved sales order
 *     description: Schedule preparation of an approved sales order.
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
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               storeKeeperId:
 *                 type: string
 *                 format: uuid
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *             required:
 *               - warehouseId
 *               - storeKeeperId
 *               - scheduledDate
 *     responses:
 *       200:
 *         description: Preparation scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
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
router.post("/:id/schedule-preparation", validate(schedulePreparationSchema), requirePermission("preparation_tasks:create"), schedulePreparation);

/**
 * @swagger
 * /api/v1/sales/orders/{id}/schedule-delivery:
 *   post:
 *     tags: [10-sales]
 *     summary: Schedule delivery for prepared sales order
 *     description: Schedule delivery of a prepared sales order.
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
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               driverId:
 *                 type: string
 *                 format: uuid
 *               vehicleId:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *             required:
 *               - scheduledDate
 *               - driverId
 *     responses:
 *       200:
 *         description: Delivery scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
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
router.post("/:id/schedule-delivery", validate(scheduleDeliverySchema), requirePermission("deliveries:create"), scheduleDelivery);

router.post(
  "/:id/confirm-pickup",
  validate(confirmPickupSchema),
  requirePermission(["preparation_tasks:update", "warehouses:read", "deliveries:update", "preparation_tasks:create"]),
  confirmPickup
);

router.post(
  "/:id/customer-pickup-confirm",
  validate(confirmCustomerPickupReceiptSchema),
  confirmCustomerPickupReceipt
);

export default router;
