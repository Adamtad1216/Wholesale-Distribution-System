import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import { validate } from "../../../middleware/validation.middleware.js";
import {
  priceTierQuerySchema,
  priceTierIdSchema,
  createPriceTierSchema,
  updatePriceTierSchema,
} from "./priceTiers.validation.js";
import {
  listPriceTiersHandler,
  getPriceTierHandler,
  createPriceTierHandler,
  updatePriceTierHandler,
  activatePriceTierHandler,
  deactivatePriceTierHandler,
  deletePriceTierHandler,
} from "./priceTiers.controller.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   - name: 11-pricing-discounts
 *     description: Dynamic Price Tiers, Product Prices, Discount Rules and Sales Quotas
 */

/**
 * @swagger
 * /api/v1/pricing/tiers:
 *   get:
 *     tags: [11-pricing-discounts]
 *     summary: List Price Tiers
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
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, ACTIVE, INACTIVE, EXPIRED] }
 *       - in: query
 *         name: isDefault
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: List of Price Tiers }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get("/", validate(priceTierQuerySchema), requirePermission("PRICE_TIER_VIEW"), listPriceTiersHandler);

/**
 * @swagger
 * /api/v1/pricing/tiers/{id}:
 *   get:
 *     tags: [11-pricing-discounts]
 *     summary: Get Price Tier
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Price Tier details }
 *       404: { description: Not found }
 */
router.get("/:id", requirePermission("PRICE_TIER_VIEW"), getPriceTierHandler);

/**
 * @swagger
 * /api/v1/pricing/tiers:
 *   post:
 *     tags: [11-pricing-discounts]
 *     summary: Create Price Tier
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Wholesale }
 *               isDefault: { type: boolean, example: false }
 *               priority: { type: integer, example: 10 }
 *               status: { type: string, enum: [DRAFT, ACTIVE, INACTIVE, EXPIRED] }
 *               description: { type: string }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Duplicate }
 */
router.post(
  "/",
  validate(createPriceTierSchema),
  requirePermission("PRICE_TIER_CREATE"),
  createPriceTierHandler,
);

/**
 * @swagger
 * /api/v1/pricing/tiers/{id}:
 *   patch:
 *     tags: [11-pricing-discounts]
 *     summary: Update Price Tier
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
 *               name: { type: string }
 *               description: { type: string }
 *               isDefault: { type: boolean }
 *               priority: { type: integer }
 *               status: { type: string, enum: [DRAFT, ACTIVE, INACTIVE, EXPIRED] }
 *     responses:
 *       200: { description: Updated }
 */
router.patch(
  "/:id",
  validate(updatePriceTierSchema),
  requirePermission("PRICE_TIER_UPDATE"),
  updatePriceTierHandler,
);

/**
 * @swagger
 * /api/v1/pricing/tiers/{id}/activate:
 *   post:
 *     tags: [11-pricing-discounts]
 *     summary: Activate a Price Tier
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Activated }
 */
router.post("/:id/activate", requirePermission("PRICE_TIER_UPDATE"), activatePriceTierHandler);

/**
 * @swagger
 * /api/v1/pricing/tiers/{id}/deactivate:
 *   post:
 *     tags: [11-pricing-discounts]
 *     summary: Deactivate a Price Tier
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deactivated }
 */
router.post("/:id/deactivate", requirePermission("PRICE_TIER_UPDATE"), deactivatePriceTierHandler);

/**
 * @swagger
 * /api/v1/pricing/tiers/{id}:
 *   delete:
 *     tags: [11-pricing-discounts]
 *     summary: Archive (soft-delete) Price Tier
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Archived }
 *       409: { description: In use }
 */
router.delete("/:id", requirePermission("PRICE_TIER_DELETE"), deletePriceTierHandler);

export default router;