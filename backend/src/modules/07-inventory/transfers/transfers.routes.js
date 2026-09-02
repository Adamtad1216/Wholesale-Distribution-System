import { Router } from 'express';
import {
  listTransfers,
  getTransfer,
  addTransfer,
  modifyTransfer,
  removeTransfer,
} from './transfers.controller.js';
import {
  createTransferSchema,
  updateTransferSchema,
} from './transfers.validation.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/permission.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/inventory/transfers:
 *   get:
 *     tags: [07-inventory]
 *     summary: List stock transfers
 *     description: Retrieve a paginated list of warehouse stock transfers with optional filtering.
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
 *         description: Filter by warehouse ID (matches either source or destination warehouse)
 *       - in: query
 *         name: fromWarehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by source warehouse ID
 *       - in: query
 *         name: toWarehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by destination warehouse ID
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product ID
 *       - in: query
 *         name: transferReason
 *         schema:
 *           type: string
 *           enum: [REBALANCING, RESTOCKING, DAMAGED_GOODS, STORE_REQUEST, SEASONAL_ALLOCATION, EXCESS_STOCK, OTHER]
 *         description: Filter by transfer reason
 *     responses:
 *       200:
 *         description: List of stock transfers
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
 *                     type: object
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  requirePermission('inventory:transfers:read'),
  listTransfers,
);

/**
 * @swagger
 * /api/v1/inventory/transfers/{id}:
 *   get:
 *     tags: [07-inventory]
 *     summary: Get stock transfer by ID
 *     description: Retrieve detailed information for a specific stock transfer.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transfer ID
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional filter to verify transfer involves this warehouse (origin or destination)
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional filter to verify transfer involves this product
 *     responses:
 *       200:
 *         description: Stock transfer details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transfer not found
 */
router.get(
  '/:id',
  requirePermission('inventory:transfers:read'),
  getTransfer,
);

/**
 * @swagger
 * /api/v1/inventory/transfers:
 *   post:
 *     tags: [07-inventory]
 *     summary: Create stock transfer
 *     description: Transfer stock between two warehouses. Automatically updates stock balances, records the transfer, and generates dynamic notifications.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fromWarehouseId, toWarehouseId, productId, transferReason, quantity]
 *             properties:
 *               fromWarehouseId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               toWarehouseId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174002
 *               transferReason:
 *                 type: string
 *                 enum: [REBALANCING, RESTOCKING, DAMAGED_GOODS, STORE_REQUEST, SEASONAL_ALLOCATION, EXCESS_STOCK, OTHER]
 *                 example: REBALANCING
 *               quantity:
 *                 type: number
 *                 example: 25
 *               remark:
 *                 type: string
 *                 example: Stock transfer due to regional demand spike
 *     responses:
 *       201:
 *         description: Stock transfer completed successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Warehouse or product not found
 */
router.post(
  '/',
  validate(createTransferSchema),
  requirePermission('inventory:transfers:create'),
  addTransfer,
);

/**
 * @swagger
 * /api/v1/inventory/transfers/{id}:
 *   patch:
 *     tags: [07-inventory]
 *     summary: Update stock transfer
 *     description: Update transfer metadata or adjust quantity with automatic stock delta balance adjustments.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transferReason:
 *                 type: string
 *                 enum: [REBALANCING, RESTOCKING, DAMAGED_GOODS, STORE_REQUEST, SEASONAL_ALLOCATION, EXCESS_STOCK, OTHER]
 *               quantity:
 *                 type: number
 *                 example: 30
 *               remark:
 *                 type: string
 *                 example: Adjusted transfer volume
 *     responses:
 *       200:
 *         description: Stock transfer updated successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transfer not found
 */
router.patch(
  '/:id',
  validate(updateTransferSchema),
  requirePermission('inventory:transfers:update'),
  modifyTransfer,
);

/**
 * @swagger
 * /api/v1/inventory/transfers/{id}:
 *   delete:
 *     tags: [07-inventory]
 *     summary: Delete and reverse stock transfer
 *     description: Soft-delete transfer and reverse inventory balances back from destination warehouse to source warehouse.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transfer ID
 *     responses:
 *       200:
 *         description: Stock transfer deleted and inventory reversed successfully
 *       400:
 *         description: Cannot reverse (destination warehouse lacks available stock)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transfer not found
 */
router.delete(
  '/:id',
  requirePermission('inventory:transfers:delete'),
  removeTransfer,
);

export default router;

