import { Router } from "express";
import {
  listWarehouseSellingPrices,
  getWarehouseSellingPrice,
  addWarehouseSellingPrice,
  modifyWarehouseSellingPrice,
  removeWarehouseSellingPrice,
} from "./warehouseSellingPrices.controller.js";
import {
  warehouseSellingPriceQuerySchema,
  createWarehouseSellingPriceSchema,
  updateWarehouseSellingPriceSchema,
} from "./warehouseSellingPrices.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import { authenticate } from "../../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/catalog/warehouse-selling-prices:
 *   get:
 *     tags: [03-product-catalog]
 *     summary: List warehouse selling prices
 *     description: Retrieve a paginated list of warehouse selling prices with optional filtering by product, warehouse, or status.
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
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter prices by product ID
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter prices by warehouse ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter prices by status
 *     responses:
 *       200:
 *         description: List of warehouse selling prices
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
 *       400:
 *         description: Bad request / validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
  "/",
  validate(warehouseSellingPriceQuerySchema),
  requirePermission("warehouse-selling-prices:read"),
  listWarehouseSellingPrices,
);

/**
 * @swagger
 * /api/v1/catalog/warehouse-selling-prices:
 *   post:
 *     tags: [03-product-catalog]
 *     summary: Create or set a warehouse selling price
 *     description: Define selling and wholesale price for a product in a specific warehouse (status defaults to ACTIVE).
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWarehouseSellingPriceInput'
 *     responses:
 *       201:
 *         description: Warehouse selling price created successfully
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         description: Product or Warehouse not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  validate(createWarehouseSellingPriceSchema),
  requirePermission("warehouse-selling-prices:create"),
  addWarehouseSellingPrice,
);

/**
 * @swagger
 * /api/v1/catalog/warehouse-selling-prices/{productId}:
 *   get:
 *     tags: [03-product-catalog]
 *     summary: Get warehouse selling prices by product ID
 *     description: Retrieve all warehouse selling prices or a specific warehouse price for a product.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional warehouse ID filter
 *     responses:
 *       200:
 *         description: Warehouse selling prices for product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/WarehouseSellingPrice'
 *                     - type: array
 *                       items:
 *                         $ref: '#/components/schemas/WarehouseSellingPrice'
 *       400:
 *         description: Invalid product ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         description: Product or selling price not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:productId",
  requirePermission("warehouse-selling-prices:read"),
  getWarehouseSellingPrice,
);

/**
 * @swagger
 * /api/v1/catalog/warehouse-selling-prices/{productId}:
 *   patch:
 *     tags: [03-product-catalog]
 *     summary: Update warehouse selling price by product ID
 *     description: Update selling and wholesale price for a product in a warehouse.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWarehouseSellingPriceInput'
 *     responses:
 *       200:
 *         description: Warehouse selling price updated successfully
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         description: Product or selling price not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:productId",
  validate(updateWarehouseSellingPriceSchema),
  requirePermission("warehouse-selling-prices:update"),
  modifyWarehouseSellingPrice,
);

/**
 * @swagger
 * /api/v1/catalog/warehouse-selling-prices/{productId}:
 *   delete:
 *     tags: [03-product-catalog]
 *     summary: Delete warehouse selling price by product ID
 *     description: Soft-delete warehouse selling price(s) for a product. Supports optional warehouseId query param.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional warehouse ID filter
 *     responses:
 *       204:
 *         description: Warehouse selling price deleted successfully
 *       400:
 *         description: Invalid product ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         description: Product or selling price not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:productId",
  requirePermission("warehouse-selling-prices:delete"),
  removeWarehouseSellingPrice,
);

export default router;
