import { Router } from 'express';
import {
  listMovements,
  addMovement,
  removeMovement,
} from './movements.controller.js';
import {
  movementQuerySchema,
  createMovementSchema,
} from './movements.validation.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/permission.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/inventory/movements:
 *   get:
 *     tags: [07-inventory]
 *     summary: List stock movements
 *     description: Retrieve a paginated list of stock movements with optional filtering.
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
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product ID
 *       - in: query
 *         name: movementType
 *         schema:
 *           type: string
 *           enum: [PURCHASE_RECEIPT, SALES_RESERVATION, SALES_FULFILLMENT, SALES_RETURN, PURCHASE_RETURN, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER_IN, TRANSFER_OUT]
 *         description: Filter by movement type
 *     responses:
 *       200:
 *         description: List of stock movements
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
 *                     $ref: '#/components/schemas/StockMovement'
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
  validate(movementQuerySchema),
  requirePermission('inventory:movements:read'),
  listMovements,
);

/**
 * @swagger
 * /api/v1/inventory/movements:
 *   post:
 *     tags: [07-inventory]
 *     summary: Create stock movement
 *     description: Create a new stock movement record.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, productId, movementType, quantity]
 *             properties:
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               movementType:
 *                 type: string
 *                 enum: [PURCHASE_RECEIPT, SALES_RESERVATION, SALES_FULFILLMENT, SALES_RETURN, PURCHASE_RETURN, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER_IN, TRANSFER_OUT]
 *                 example: PURCHASE_RECEIPT
 *               quantity:
 *                 type: number
 *                 example: 100
 *               referenceType:
 *                 type: string
 *                 example: PURCHASE_ORDER
 *               referenceId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174002
 *               unitCost:
 *                 type: number
 *                 example: 50
 *               notes:
 *                 type: string
 *                 example: Initial stock receipt
 *     responses:
 *       201:
 *         description: Movement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/StockMovement'
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
  validate(createMovementSchema),
  requirePermission('inventory:movements:create'),
  addMovement,
);

/**
 * @swagger
 * /api/v1/inventory/movements/{id}:
 *   delete:
 *     tags: [07-inventory]
 *     summary: Delete stock movement
 *     description: Soft-delete (archive) a stock movement record.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock movement ID
 *     responses:
 *       200:
 *         description: Movement deleted successfully
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
 *                   example: Stock movement deleted successfully
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
 *         description: Movement not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  requirePermission('inventory:movements:delete'),
  removeMovement,
);

export default router;
