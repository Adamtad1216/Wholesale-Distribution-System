import { Router } from 'express';
import {
  listSellingPrices,
  getSellingPrice,
  addSellingPrice,
  modifySellingPrice,
  removeSellingPrice,
} from './selling-prices.controller.js';
import {
  sellingPriceQuerySchema,
  createSellingPriceSchema,
  updateSellingPriceSchema,
} from './selling-prices.validation.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/permission.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/inventory/selling-prices:
 *   get:
 *     tags: [07-inventory]
 *     summary: List warehouse selling prices
 *     description: Retrieve a paginated list of warehouse-specific selling prices.
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of selling prices
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
 *                     $ref: '#/components/schemas/WarehouseSellingPrice'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  validate(sellingPriceQuerySchema),
  requirePermission('inventory:prices:read'),
  listSellingPrices,
);

/**
 * @swagger
 * /api/v1/inventory/selling-prices/{id}:
 *   get:
 *     tags: [07-inventory]
 *     summary: Get selling price by ID
 *     description: Retrieve a specific warehouse selling price.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Selling price ID
 *     responses:
 *       200:
 *         description: Selling price details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/WarehouseSellingPrice'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Selling price not found
 */
router.get(
  '/:id',
  requirePermission('inventory:prices:read'),
  getSellingPrice,
);

/**
 * @swagger
 * /api/v1/inventory/selling-prices:
 *   post:
 *     tags: [07-inventory]
 *     summary: Create warehouse selling price
 *     description: Create a new warehouse-specific selling price for a product.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, warehouseId, sellingPrice, wholesalePrice]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               sellingPrice:
 *                 type: number
 *                 example: 25.00
 *               wholesalePrice:
 *                 type: number
 *                 example: 20.00
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 default: ACTIVE
 *     responses:
 *       201:
 *         description: Selling price created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/WarehouseSellingPrice'
 *       400:
 *         description: Validation error or price already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  validate(createSellingPriceSchema),
  requirePermission('inventory:prices:create'),
  addSellingPrice,
);

/**
 * @swagger
 * /api/v1/inventory/selling-prices/{id}:
 *   patch:
 *     tags: [07-inventory]
 *     summary: Update warehouse selling price
 *     description: Update an existing warehouse selling price.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Selling price ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sellingPrice:
 *                 type: number
 *                 example: 30.00
 *               wholesalePrice:
 *                 type: number
 *                 example: 24.00
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Selling price updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/WarehouseSellingPrice'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Selling price not found
 */
router.patch(
  '/:id',
  validate(updateSellingPriceSchema),
  requirePermission('inventory:prices:update'),
  modifySellingPrice,
);

/**
 * @swagger
 * /api/v1/inventory/selling-prices/{id}:
 *   delete:
 *     tags: [07-inventory]
 *     summary: Delete warehouse selling price
 *     description: Soft-delete (archive) a warehouse selling price.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Selling price ID
 *     responses:
 *       200:
 *         description: Selling price deleted successfully
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
 *                   example: Selling price deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Selling price not found
 */
router.delete(
  '/:id',
  requirePermission('inventory:prices:delete'),
  removeSellingPrice,
);

export default router;
