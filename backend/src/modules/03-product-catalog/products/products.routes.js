import { Router } from "express";
import {
  listProducts,
  getProduct,
  addProduct,
  modifyProduct,
  removeProduct,
  addImage,
  removeImage,
  addTier,
  modifyTier,
  removeTier,
  addDiscount,
  modifyDiscount,
  removeDiscount,
} from "./products.controller.js";
import {
  productQuerySchema,
  productIdSchema,
  createProductSchema,
  updateProductSchema,
  productImageSchema,
  priceTierSchema,
  discountRuleSchema,
} from "./products.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import { authenticate } from "../../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/catalog/products:
 *   get:
 *     tags: [03-product-catalog]
 *     summary: List products
 *     description: Retrieve a paginated list of products with optional filtering.
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product SKU or name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by brand ID
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by unit ID
 *     responses:
 *       200:
 *         description: List of products
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
 *                     $ref: '#/components/schemas/Product'
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
  "/",
  validate(productQuerySchema),
  requirePermission("products:read"),
  listProducts,
);

/**
 * @swagger
 * /api/v1/catalog/products:
 *   post:
 *     tags: [03-product-catalog]
 *     summary: Create a product
 *     description: Create a new product with pricing, category, brand, and unit. Optionally add initial images.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *           example:
 *             sku: PRD-001
 *             name: Wireless Headphones
 *             categoryId: 123e4567-e89b-12d3-a456-426614174000
 *             brandId: 123e4567-e89b-12d3-a456-426614174001
 *             unitId: 123e4567-e89b-12d3-a456-426614174002
 *             purchasePrice: 100
 *             sellingPrice: 150
 *             wholesalePrice: 120
 *             minimumStockLevel: 10
 *             reorderLevel: 5
 *             status: ACTIVE
 *             images:
 *               - imageUrl: https://example.com/image.jpg
 *                 isPrimary: true
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Product'
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
 *       409:
 *         description: Product SKU already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  validate(createProductSchema),
  requirePermission("products:create"),
  addProduct,
);

/**
 * @swagger
 * /api/v1/catalog/products/{id}:
 *   get:
 *     tags: [03-product-catalog]
 *     summary: Get product by ID
 *     description: Retrieve detailed information for a specific product including images, price tiers, and discount rules.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Product'
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  requirePermission("products:read"),
  getProduct,
);

/**
 * @swagger
 * /api/v1/catalog/products/{id}:
 *   patch:
 *     tags: [03-product-catalog]
 *     summary: Update a product
 *     description: Update product details including pricing and relations.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             $ref: '#/components/schemas/Product'
 *           example:
 *             name: Wireless Headphones Pro
 *             sellingPrice: 160
 *             status: ACTIVE
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Product'
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Product SKU already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id",
  validate(updateProductSchema),
  requirePermission("products:update"),
  modifyProduct,
);

/**
 * @swagger
 * /api/v1/catalog/products/{id}:
 *   delete:
 *     tags: [03-product-catalog]
 *     summary: Delete a product
 *     description: Soft-delete a product by ID.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product deleted successfully
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  requirePermission("products:delete"),
  removeProduct,
);

/**
 * @swagger
 * /api/v1/catalog/products/{id}/images:
 *   post:
 *     tags: [03-product-catalog]
 *     summary: Add product image
 *     description: Add a new image URL to a product. Set isPrimary to true to mark it as the primary image.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             $ref: '#/components/schemas/ProductImage'
 *           example:
 *             imageUrl: https://example.com/image.jpg
 *             isPrimary: true
 *     responses:
 *       201:
 *         description: Image added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ProductImage'
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/:id/images",
  validate(productImageSchema),
  requirePermission("products:update"),
  addImage,
);

/**
 * @swagger
 * /api/v1/catalog/products/{id}/images/{imageId}:
 *   delete:
 *     tags: [03-product-catalog]
 *     summary: Remove product image
 *     description: Remove an image from a product by image ID.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Image ID
 *     responses:
 *       204:
 *         description: Image removed successfully
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
 *         description: Product or image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id/images/:imageId",
  requirePermission("products:update"),
  removeImage,
);

/**
 * @swagger
 * /api/v1/catalog/products/{id}/price-tiers:
 *   post:
 *     tags: [03-product-catalog]
 *     summary: Add price tier
 *     description: Add a quantity-based price tier to a product.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             $ref: '#/components/schemas/PriceTier'
 *           example:
 *             minQuantity: 10
 *             maxQuantity: 100
 *             unitPrice: 70
 *     responses:
 *       201:
 *         description: Price tier added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/PriceTier'
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/:id/price-tiers",
  validate(priceTierSchema),
  requirePermission("products:update"),
  addTier,
);

/**
 * @swagger
 * /api/v1/catalog/products/{id}/price-tiers/{tierId}:
 *   patch:
 *     tags: [03-product-catalog]
 *     summary: Update price tier
 *     description: Update an existing price tier for a product.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price Tier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PriceTier'
 *           example:
 *             minQuantity: 10
 *             maxQuantity: 200
 *             unitPrice: 65
 *     responses:
 *       200:
 *         description: Price tier updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/PriceTier'
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
 *         description: Price tier not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id/price-tiers/:tierId",
  validate(priceTierSchema),
  requirePermission("products:update"),
  modifyTier,
);

/**
 * @swagger
 * /api/v1/catalog/products/{id}/price-tiers/{tierId}:
 *   delete:
 *     tags: [03-product-catalog]
 *     summary: Remove price tier
 *     description: Remove a price tier from a product.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price Tier ID
 *     responses:
 *       204:
 *         description: Price tier removed successfully
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
 *         description: Price tier not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id/price-tiers/:tierId",
  requirePermission("products:update"),
  removeTier,
);

/**
 * @swagger
 * /api/v1/catalog/products/{id}/discount-rules:
 *   post:
 *     tags: [03-product-catalog]
 *     summary: Add discount rule
 *     description: Add a quantity or date-based discount rule to a product.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             $ref: '#/components/schemas/DiscountRule'
 *           example:
 *             name: Summer Sale
 *             discountType: PERCENTAGE
 *             discountValue: 10
 *             minQuantity: 5
 *             maxQuantity: 50
 *             status: ACTIVE
 *     responses:
 *       201:
 *         description: Discount rule added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/DiscountRule'
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/:id/discount-rules",
  validate(discountRuleSchema),
  requirePermission("products:update"),
  addDiscount,
);

/**
 * @swagger
 * /api/v1/catalog/products/{id}/discount-rules/{ruleId}:
 *   patch:
 *     tags: [03-product-catalog]
 *     summary: Update discount rule
 *     description: Update an existing discount rule for a product.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Discount Rule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiscountRule'
 *           example:
 *             name: Summer Sale Extended
 *             discountValue: 15
 *             status: ACTIVE
 *     responses:
 *       200:
 *         description: Discount rule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/DiscountRule'
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
 *         description: Discount rule not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id/discount-rules/:ruleId",
  validate(discountRuleSchema),
  requirePermission("products:update"),
  modifyDiscount,
);

/**
 * @swagger
 * /api/v1/catalog/products/{id}/discount-rules/{ruleId}:
 *   delete:
 *     tags: [03-product-catalog]
 *     summary: Remove discount rule
 *     description: Soft-delete a discount rule from a product.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Discount Rule ID
 *     responses:
 *       204:
 *         description: Discount rule removed successfully
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
 *         description: Discount rule not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id/discount-rules/:ruleId",
  requirePermission("products:update"),
  removeDiscount,
);

export default router;
