import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import { validate } from "../../../middleware/validation.middleware.js";
import {
  discountRuleQuerySchema,
  discountRuleIdSchema,
  createDiscountRuleSchema,
  updateDiscountRuleSchema,
} from "./discountRules.validation.js";
import {
  listDiscountRulesHandler,
  getDiscountRuleHandler,
  createDiscountRuleHandler,
  updateDiscountRuleHandler,
  deleteDiscountRuleHandler,
} from "./discountRules.controller.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/v1/pricing/discounts:
 *   get:
 *     tags: [11-pricing-discounts]
 *     summary: List Discount Rules
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
 *       200: { description: List of discount rules }
 */
router.get(
  "/",
  validate(discountRuleQuerySchema),
  requirePermission("DISCOUNT_VIEW"),
  listDiscountRulesHandler,
);

/**
 * @swagger
 * /api/v1/pricing/discounts/{id}:
 *   get:
 *     tags: [11-pricing-discounts]
 *     summary: Get Discount Rule
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Discount rule details }
 *       404: { description: Not found }
 */
router.get(
  "/:id",
  requirePermission("DISCOUNT_VIEW"),
  getDiscountRuleHandler,
);

/**
 * @swagger
 * /api/v1/pricing/discounts:
 *   post:
 *     tags: [11-pricing-discounts]
 *     summary: Create Discount Rule
 *     description: |
 *       Create a discount rule. The rule applies only when ALL set conditions match:
 *       - within startsAt/endsAt window
 *       - status ACTIVE
 *       - priceTierId matches the customer's tier (if set)
 *       - warehouseId matches the fulfilling warehouse (if set)
 *       - productId matches the product (if set)
 *       - quantity meets minQuantity (if set)
 *       When multiple rules qualify, the highest priority is used.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, discountType, discountValue]
 *             properties:
 *               name: { type: string }
 *               productId: { type: string, format: uuid, nullable: true }
 *               priceTierId: { type: string, format: uuid, nullable: true }
 *               warehouseId: { type: string, format: uuid, nullable: true }
 *               minQuantity: { type: number, nullable: true }
 *               discountType: { type: string, enum: [PERCENTAGE, FIXED_AMOUNT] }
 *               discountValue: { type: number, example: 5 }
 *               priority: { type: integer, example: 10 }
 *               status: { type: string, enum: [DRAFT, ACTIVE, INACTIVE, EXPIRED] }
 *               startsAt: { type: string, format: date-time, nullable: true }
 *               endsAt: { type: string, format: date-time, nullable: true }
 *     responses:
 *       201: { description: Created }
 */
router.post(
  "/",
  validate(createDiscountRuleSchema),
  requirePermission("DISCOUNT_CREATE"),
  createDiscountRuleHandler,
);

/**
 * @swagger
 * /api/v1/pricing/discounts/{id}:
 *   patch:
 *     tags: [11-pricing-discounts]
 *     summary: Update Discount Rule
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
 *               productId: { type: string, format: uuid, nullable: true }
 *               priceTierId: { type: string, format: uuid, nullable: true }
 *               warehouseId: { type: string, format: uuid, nullable: true }
 *               minQuantity: { type: number, nullable: true }
 *               discountType: { type: string, enum: [PERCENTAGE, FIXED_AMOUNT] }
 *               discountValue: { type: number }
 *               priority: { type: integer }
 *               status: { type: string, enum: [DRAFT, ACTIVE, INACTIVE, EXPIRED] }
 *               startsAt: { type: string, format: date-time, nullable: true }
 *               endsAt: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200: { description: Updated }
 */
router.patch(
  "/:id",
  validate(updateDiscountRuleSchema),
  requirePermission("DISCOUNT_UPDATE"),
  updateDiscountRuleHandler,
);

/**
 * @swagger
 * /api/v1/pricing/discounts/{id}:
 *   delete:
 *     tags: [11-pricing-discounts]
 *     summary: Delete Discount Rule
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
  requirePermission("DISCOUNT_DELETE"),
  deleteDiscountRuleHandler,
);

export default router;