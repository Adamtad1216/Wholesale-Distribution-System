import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import { validate } from "../../../middleware/validation.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import {
  getAssignedTasks,
  getTaskDetails,
  markItemsPrepared,
  completeTask,
} from "./salesOrders.storekeeper.service.js";
import {
  preparationTaskQuerySchema,
  preparationTaskIdSchema,
  markPreparedSchema,
  completeTaskSchema,
} from "./salesOrders.storekeeper.validation.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/sales/orders/store-keeper/tasks:
 *   get:
 *     tags: [10-sales]
 *     summary: Get assigned preparation tasks for store keeper
 *     description: Retrieve preparation tasks assigned to the authenticated store keeper.
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
 *         description: Filter by task status
 *     responses:
 *       200:
 *         description: Assigned tasks retrieved successfully
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
  "/tasks",
  validate(preparationTaskQuerySchema),
  requirePermission("preparation_tasks:read"),
  async (req, res, next) => {
    try {
      const result = await getAssignedTasks(req.query, req.user);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/sales/orders/store-keeper/tasks/{id}:
 *   get:
 *     tags: [10-sales]
 *     summary: Get preparation task details
 *     description: Retrieve details of a specific preparation task assigned to the store keeper.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Preparation task ID
 *     responses:
 *       200:
 *         description: Task details retrieved successfully
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
  "/tasks/:id",
  requirePermission("preparation_tasks:read"),
  async (req, res, next) => {
    try {
      const task = await getTaskDetails(req.params.id, req.user);
      sendSuccess(res, task);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/sales/orders/store-keeper/tasks/{id}/mark-prepared:
 *   post:
 *     tags: [10-sales]
 *     summary: Mark items as prepared in preparation task
 *     description: Update prepared quantities and statuses for items in a preparation task.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Preparation task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     preparationTaskItemId:
 *                       type: string
 *                       format: uuid
 *                     preparedQuantity:
 *                       type: number
 *                 required:
 *                   - preparationTaskItemId
 *                   - preparedQuantity
 *             required:
 *               - items
 *     responses:
 *       200:
 *         description: Items marked as prepared successfully
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
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/tasks/:id/mark-prepared",
  validate(markPreparedSchema),
  requirePermission("preparation_tasks:update"),
  async (req, res, next) => {
    try {
      const result = await markItemsPrepared(req.params.id, req.body.items, req.user);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/v1/sales/orders/store-keeper/tasks/{id}/complete:
 *   post:
 *     tags: [10-sales]
 *     summary: Complete preparation task
 *     description: Mark a preparation task as completed and update the sales order status.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Preparation task ID
 *     responses:
 *       200:
 *         description: Task completed successfully
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
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/tasks/:id/complete",
  validate(completeTaskSchema),
  requirePermission("preparation_tasks:update"),
  async (req, res, next) => {
    try {
      const result = await completeTask(req.params.id, req.user);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
