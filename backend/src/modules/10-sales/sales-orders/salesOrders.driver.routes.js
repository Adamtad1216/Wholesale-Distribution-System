import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import { validate } from "../../../middleware/validation.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import {
  getAssignedDeliveries,
  getDeliveryDetails,
  startDelivery,
  completeDelivery,
} from "./salesOrders.driver.service.js";
import {
  deliveryQuerySchema,
  deliveryIdSchema,
  startDeliverySchema,
  completeDeliverySchema,
} from "./salesOrders.driver.validation.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/sales/orders/driver/deliveries:
 *   get:
 *     tags: [10-sales]
 *     summary: Get assigned deliveries for driver
 *     description: Retrieve deliveries assigned to the authenticated driver.
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
 *         description: Filter by delivery status
 *     responses:
 *       200:
 *         description: Assigned deliveries retrieved successfully
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
 *                 meta:
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
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/deliveries",
  validate(deliveryQuerySchema),
  requirePermission("deliveries:read"),
  async (req, res, next) => {
    try {
      const result = await getAssignedDeliveries(req.query, req.user);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/sales/orders/driver/deliveries/{id}:
 *   get:
 *     tags: [10-sales]
 *     summary: Get delivery details
 *     description: Retrieve details of a specific delivery assigned to the driver.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Delivery ID
 *     responses:
 *       200:
 *         description: Delivery details retrieved successfully
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
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/deliveries/:id",
  requirePermission("deliveries:read"),
  async (req, res, next) => {
    try {
      const delivery = await getDeliveryDetails(req.params.id, req.user);
      sendSuccess(res, delivery);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/sales/orders/driver/deliveries/{id}/start:
 *   post:
 *     tags: [10-sales]
 *     summary: Start delivery
 *     description: Mark a scheduled delivery as dispatched and the sales order as out for delivery.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Delivery ID
 *     responses:
 *       200:
 *         description: Delivery started successfully
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
 *         description: Validation or transition error
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
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/deliveries/:id/start",
  validate(startDeliverySchema),
  requirePermission("deliveries:update"),
  async (req, res, next) => {
    try {
      const result = await startDelivery(req.params.id, req.user.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/sales/orders/driver/deliveries/{id}/complete:
 *   post:
 *     tags: [10-sales]
 *     summary: Complete delivery with proof
 *     description: Mark a delivery as delivered with optional proof and update the sales order status.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Delivery ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proof:
 *                 type: object
 *                 properties:
 *                   proofType:
 *                     type: string
 *                   recipientName:
 *                     type: string
 *                   notes:
 *                     type: string
 *     responses:
 *       200:
 *         description: Delivery completed successfully
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
 *         description: Validation or transition error
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
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/deliveries/:id/complete",
  validate(completeDeliverySchema),
  requirePermission("deliveries:update"),
  async (req, res, next) => {
    try {
      const result = await completeDelivery(req.params.id, req.body.proof, req.user.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
