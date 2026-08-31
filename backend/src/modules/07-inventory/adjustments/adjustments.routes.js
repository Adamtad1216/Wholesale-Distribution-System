import { Router } from 'express';
import {
  listAdjustments,
  getAdjustment,
  addAdjustment,
  modifyAdjustment,
  approveOrRejectAdjustment,
  removeAdjustment,
  getAdjustmentItemHandler,
  addAdjustmentItemHandler,
  modifyAdjustmentItem,
  removeAdjustmentItemHandler,
} from './adjustments.controller.js';
import {
  adjustmentQuerySchema,
  createAdjustmentSchema,
  updateAdjustmentSchema,
  approveAdjustmentSchema,
  createAdjustmentItemSchema,
  updateAdjustmentItemSchema,
} from './adjustments.validation.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/permission.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/inventory/adjustments:
 *   get:
 *     tags: [07-inventory]
 *     summary: List stock adjustments
 *     description: Retrieve a paginated list of stock adjustments with optional filtering.
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
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by warehouse ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of stock adjustments
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
 *                     $ref: '#/components/schemas/StockAdjustment'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
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
router.get(
  '/',
  validate(adjustmentQuerySchema),
  requirePermission('inventory:adjustments:read'),
  listAdjustments,
);

/**
 * @swagger
 * /api/v1/inventory/adjustments/{id}:
 *   get:
 *     tags: [07-inventory]
 *     summary: Get stock adjustment by ID
 *     description: Retrieve detailed information for a specific stock adjustment.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock adjustment ID
 *     responses:
 *       200:
 *         description: Stock adjustment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/StockAdjustment'
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
 *         description: Adjustment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  requirePermission('inventory:adjustments:read'),
  getAdjustment,
);

/**
 * @swagger
 * /api/v1/inventory/adjustments:
 *   post:
 *     tags: [07-inventory]
 *     summary: Create stock adjustment
 *     description: Create a new stock adjustment with adjustment items.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, reason, items]
 *             properties:
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               reason:
 *                 type: string
 *                 example: Physical inventory count
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, systemQuantity, actualQuantity]
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174001
 *                     systemQuantity:
 *                       type: number
 *                       example: 100
 *                     actualQuantity:
 *                       type: number
 *                       example: 95
 *                     reason:
 *                       type: string
 *                       example: Damaged goods
 *     responses:
 *       201:
 *         description: Adjustment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/StockAdjustment'
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
 */
router.post(
  '/',
  validate(createAdjustmentSchema),
  requirePermission('inventory:adjustments:create'),
  addAdjustment,
);

/**
 * @swagger
 * /api/v1/inventory/adjustments/{id}:
 *   patch:
 *     tags: [07-inventory]
 *     summary: Update stock adjustment
 *     description: Update reason and items of a pending stock adjustment.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock adjustment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Updated inventory count reason
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, actualQuantity]
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174001
 *                     actualQuantity:
 *                       type: number
 *                       example: 95
 *                     reason:
 *                       type: string
 *                       example: Damaged goods
 *     responses:
 *       200:
 *         description: Adjustment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/StockAdjustment'
 *       400:
 *         description: Validation error or adjustment not pending
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Adjustment not found
 */
router.patch(
  '/:id',
  validate(updateAdjustmentSchema),
  requirePermission('inventory:adjustments:update'),
  modifyAdjustment,
);

/**
 * @swagger
 * /api/v1/inventory/adjustments/{id}/items:
 *   get:
 *     tags: [07-inventory]
 *     summary: Get adjustment item by ID
 *     description: Retrieve a specific item from a stock adjustment.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock adjustment ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Adjustment item ID
 *     responses:
 *       200:
 *         description: Adjustment item details
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
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     adjustmentId:
 *                       type: string
 *                       format: uuid
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     systemQuantity:
 *                       type: number
 *                     actualQuantity:
 *                       type: number
 *                     difference:
 *                       type: number
 *                     reason:
 *                       type: string
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Adjustment item not found
 */
router.get(
  '/:id/items/:itemId',
  requirePermission('inventory:adjustments:read'),
  getAdjustmentItemHandler,
);

/**
 * @swagger
 * /api/v1/inventory/adjustments/{id}/items:
 *   post:
 *     tags: [07-inventory]
 *     summary: Add item to stock adjustment
 *     description: Add a new item to a pending stock adjustment.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock adjustment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, actualQuantity]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               actualQuantity:
 *                 type: number
 *                 example: 95
 *               reason:
 *                 type: string
 *                 example: Damaged goods
 *     responses:
 *       201:
 *         description: Item added successfully
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
 *         description: Validation error or adjustment not pending
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Adjustment not found
 */
router.post(
  '/:id/items',
  validate(createAdjustmentItemSchema),
  requirePermission('inventory:adjustments:update'),
  addAdjustmentItemHandler,
);

/**
 * @swagger
 * /api/v1/inventory/adjustments/{id}/items/{itemId}:
 *   patch:
 *     tags: [07-inventory]
 *     summary: Update adjustment item
 *     description: Update an item in a pending stock adjustment.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock adjustment ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Adjustment item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actualQuantity:
 *                 type: number
 *                 example: 90
 *               reason:
 *                 type: string
 *                 example: Updated count
 *     responses:
 *       200:
 *         description: Item updated successfully
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
 *         description: Validation error or adjustment not pending
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Adjustment item not found
 */
router.patch(
  '/:id/items/:itemId',
  validate(updateAdjustmentItemSchema),
  requirePermission('inventory:adjustments:update'),
  modifyAdjustmentItem,
);

/**
 * @swagger
 * /api/v1/inventory/adjustments/{id}/items/{itemId}:
 *   delete:
 *     tags: [07-inventory]
 *     summary: Remove adjustment item
 *     description: Remove an item from a pending stock adjustment.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock adjustment ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Adjustment item ID
 *     responses:
 *       200:
 *         description: Item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Adjustment item removed successfully
 *       400:
 *         description: Validation error or adjustment not pending
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Adjustment item not found
 */
router.delete(
  '/:id/items/:itemId',
  requirePermission('inventory:adjustments:delete'),
  removeAdjustmentItemHandler,
);

/**
 * @swagger
 * /api/v1/inventory/adjustments/{id}/approve:
 *   patch:
 *     tags: [07-inventory]
 *     summary: Approve or reject stock adjustment
 *     description: Approve or reject a pending stock adjustment.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock adjustment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *                 example: APPROVE
 *               notes:
 *                 type: string
 *                 example: Verified and approved
 *     responses:
 *       200:
 *         description: Adjustment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/StockAdjustment'
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
 *         description: Adjustment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/:id/approve',
  validate(approveAdjustmentSchema),
  requirePermission('inventory:adjustments:approve'),
  approveOrRejectAdjustment,
);

/**
 * @swagger
 * /api/v1/inventory/adjustments/{id}:
 *   delete:
 *     tags: [07-inventory]
 *     summary: Delete stock adjustment
 *     description: Soft-delete (archive) a stock adjustment.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock adjustment ID
 *     responses:
 *       200:
 *         description: Adjustment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Stock adjustment deleted successfully
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
 *         description: Adjustment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  requirePermission('inventory:adjustments:delete'),
  removeAdjustment,
);

export default router;
