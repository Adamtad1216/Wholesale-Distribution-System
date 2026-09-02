import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import { validate } from "../../../middleware/validation.middleware.js";
import {
  productPriceQuerySchema,
  productPriceIdSchema,
  createProductPriceSchema,
  updateProductPriceSchema,
} from "./productPrices.validation.js";
import {
  listProductPricesHandler,
  getProductPriceHandler,
  createProductPriceHandler,
  updateProductPriceHandler,
  deleteProductPriceHandler,
} from "./productPrices.controller.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/v1/pricing/product-prices:
 *   get:
 *     tags: [11-pricing-discounts]
 *     summary: List Product Prices
 *     description: Retrieve product-price-tiers configured per Product + Price Tier + Warehouse.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: priceTierId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: warehouseId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, ACTIVE, INACTIVE, EXPIRED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: List of product prices }
 */
router.get(
  "/",
  validate(productPriceQuerySchema),
  requirePermission("PRODUCT_PRICE_VIEW"),
  listProductPricesHandler,
);

/**
 * @swagger
 * /api/v1/pricing/product-prices/{id}:
 *   get:
 *     tags: [11-pricing-discounts]
 *     summary: Get Product Price
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Product price details }
 *       404: { description: Not found }
 */
router.get(
  "/:id",
  requirePermission("PRODUCT_PRICE_VIEW"),
  getProductPriceHandler,
);

/**
 * @swagger
 * /api/v1/pricing/product-prices:
 *   post:
 *     tags: [11-pricing-discounts]
 *     summary: Create Product Price
 *     description: Create a new product price. The combination Product + PriceTier + Warehouse with status ACTIVE must be unique.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, priceTierId, warehouseId, unitPrice]
 *             properties:
 *               productId: { type: string, format: uuid }
 *               priceTierId: { type: string, format: uuid }
 *               warehouseId: { type: string, format: uuid }
 *               unitPrice: { type: number, example: 95 }
 *               status: { type: string, enum: [DRAFT, ACTIVE, INACTIVE, EXPIRED] }
 *               startsAt: { type: string, format: date-time, nullable: true }
 *               endsAt: { type: string, format: date-time, nullable: true }
 *     responses:
 *       201: { description: Created }
 *       404: { description: Product, PriceTier or Warehouse not found }
 *       409: { description: Duplicate active price }
 */
router.post(
  "/",
  validate(createProductPriceSchema),
  requirePermission("PRODUCT_PRICE_CREATE"),
  createProductPriceHandler,
);

/**
 * @swagger
 * /api/v1/pricing/product-prices/{id}:
 *   patch:
 *     tags: [11-pricing-discounts]
 *     summary: Update Product Price
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
 *               unitPrice: { type: number }
 *               status: { type: string, enum: [DRAFT, ACTIVE, INACTIVE, EXPIRED] }
 *               startsAt: { type: string, format: date-time, nullable: true }
 *               endsAt: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200: { description: Updated }
 */
router.patch(
  "/:id",
  validate(updateProductPriceSchema),
  requirePermission("PRODUCT_PRICE_UPDATE"),
  updateProductPriceHandler,
);

/**
 * @swagger
 * /api/v1/pricing/product-prices/{id}:
 *   delete:
 *     tags: [11-pricing-discounts]
 *     summary: Delete Product Price
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Deleted }
 */
router.delete(
  "/:id",
  requirePermission("PRODUCT_PRICE_DELETE"),
  deleteProductPriceHandler,
);

export default router;