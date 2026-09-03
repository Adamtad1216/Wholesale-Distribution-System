import { Router } from "express";
import {
  listUnits,
  getUnit,
  addUnit,
  modifyUnit,
  removeUnit,
} from "./units.controller.js";
import {
  unitQuerySchema,
  createUnitSchema,
  updateUnitSchema,
} from "./units.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";
import { authenticate } from "../../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/catalog/units:
 *   get:
 *     tags: [03-product-catalog]
 *     summary: List units
 *     description: Retrieve a paginated list of units with optional filtering.
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
 *         description: Search by unit name or abbreviation
 *     responses:
 *       200:
 *         description: List of units
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
 *                     $ref: '#/components/schemas/Unit'
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
  validate(unitQuerySchema),
  requirePermission("units:read"),
  listUnits,
);

/**
 * @swagger
 * /api/v1/catalog/units:
 *   post:
 *     tags: [03-product-catalog]
 *     summary: Create a unit
 *     description: Create a new measurement unit.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUnitInput'
 *     responses:
 *       201:
 *         description: Unit created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Unit'
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
 *         description: Unit abbreviation already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  validate(createUnitSchema),
  requirePermission("units:create"),
  addUnit,
);

/**
 * @swagger
 * /api/v1/catalog/units/{id}:
 *   get:
 *     tags: [03-product-catalog]
 *     summary: Get unit by ID
 *     description: Retrieve detailed information for a specific unit.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unit ID
 *     responses:
 *       200:
 *         description: Unit details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Unit'
 *       400:
 *         description: Invalid UUID format
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
 *         description: Unit not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  requirePermission("units:read"),
  getUnit,
);

/**
 * @swagger
 * /api/v1/catalog/units/{id}:
 *   patch:
 *     tags: [03-product-catalog]
 *     summary: Update a unit
 *     description: Update unit details.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUnitInput'
 *     responses:
 *       200:
 *         description: Unit updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Unit'
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
 *         description: Unit not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Unit abbreviation already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id",
  validate(updateUnitSchema),
  requirePermission("units:update"),
  modifyUnit,
);

/**
 * @swagger
 * /api/v1/catalog/units/{id}:
 *   delete:
 *     tags: [03-product-catalog]
 *     summary: Delete a unit
 *     description: Soft-delete a unit by ID. Cannot delete units with associated products.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unit ID
 *     responses:
 *       204:
 *         description: Unit deleted successfully
 *       400:
 *         description: Cannot delete unit with associated products
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
 *         description: Unit not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  requirePermission("units:delete"),
  removeUnit,
);

export default router;
