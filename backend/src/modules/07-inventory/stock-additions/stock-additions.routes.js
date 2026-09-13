import { Router } from 'express';
import {
  listStockAdditions,
  getStockAddition,
  addStockAddition,
  modifyStockAddition,
  removeStockAddition,
} from './stock-additions.controller.js';
import {
  stockAdditionQuerySchema,
  createStockAdditionSchema,
  updateStockAdditionSchema,
} from './stock-additions.validation.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/permission.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/inventory/stock-additions:
 *   get:
 *     tags: [07-inventory]
 *     summary: List product stock additions
 *     description: Retrieve a paginated list of all product quantity additions across warehouses.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: warehouseId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: referenceType
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Paginated list of stock additions
 */
router.get(
  '/',
  validate(stockAdditionQuerySchema),
  requirePermission('inventory:stock-additions:read'),
  listStockAdditions,
);

/**
 * @swagger
 * /api/v1/inventory/stock-additions/{id}:
 *   get:
 *     tags: [07-inventory]
 *     summary: Get stock addition by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stock addition details
 *       404:
 *         description: Not found
 */
router.get(
  '/:id',
  requirePermission('inventory:stock-additions:read'),
  getStockAddition,
);

/**
 * @swagger
 * /api/v1/inventory/stock-additions:
 *   post:
 *     tags: [07-inventory]
 *     summary: Add quantity to a warehouse product
 *     description: Records a new stock quantity addition for a specific warehouse product, tracking previousTotal, addedQuantity and new currentTotal.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, productId, addedQuantity]
 *             properties:
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               productId:
 *                 type: string
 *                 format: uuid
 *               addedQuantity:
 *                 type: number
 *                 example: 50
 *               notes:
 *                 type: string
 *               referenceType:
 *                 type: string
 *                 example: MANUAL_INTAKE
 *               referenceId:
 *                 type: string
 *                 format: uuid
 *               addedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Stock addition created
 */
router.post(
  '/',
  validate(createStockAdditionSchema),
  requirePermission('inventory:stock-additions:create'),
  addStockAddition,
);

/**
 * @swagger
 * /api/v1/inventory/stock-additions/{id}:
 *   patch:
 *     tags: [07-inventory]
 *     summary: Update a stock addition record
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
 *               addedQuantity:
 *                 type: number
 *               notes:
 *                 type: string
 *               referenceType:
 *                 type: string
 *               referenceId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Stock addition updated (cascades balance to subsequent records)
 */
router.patch(
  '/:id',
  validate(updateStockAdditionSchema),
  requirePermission('inventory:stock-additions:update'),
  modifyStockAddition,
);

/**
 * @swagger
 * /api/v1/inventory/stock-additions/{id}:
 *   delete:
 *     tags: [07-inventory]
 *     summary: Archive a stock addition record
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stock addition archived (balance rebalanced)
 */
router.delete(
  '/:id',
  requirePermission('inventory:stock-additions:delete'),
  removeStockAddition,
);

export default router;
