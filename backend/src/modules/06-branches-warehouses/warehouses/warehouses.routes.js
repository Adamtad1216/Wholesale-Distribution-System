import { Router } from "express";
import {
  listWarehouses,
  getWarehouse,
  addWarehouse,
  modifyWarehouse,
  removeWarehouse,
} from "./warehouses.controller.js";
import {
  warehouseQuerySchema,
  createWarehouseSchema,
  updateWarehouseSchema,
} from "./warehouses.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/warehouses:
 *   get:
 *     tags: [06-branches-warehouses]
 *     summary: List warehouses
 *     description: Retrieve a paginated list of warehouses with optional filtering.
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
 *         description: Search by warehouse name or code
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of warehouses
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginationResponse'
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
  validate(warehouseQuerySchema),
  requirePermission("warehouses:read"),
  listWarehouses,
);

/**
 * @swagger
 * /api/v1/warehouses:
 *   post:
 *     tags: [06-branches-warehouses]
 *     summary: Create a warehouse
 *     description: Create a new warehouse under an existing branch.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWarehouseRequest'
 *           example:
 *             code: "WH-001"
 *             name: "Addis Ababa Central Warehouse"
 *             branchId: "123e4567-e89b-12d3-a456-426614174000"
 *             location: "Bole Sub City, Addis Ababa"
 *             region: "ADDIS_ABABA"
 *             city: "Addis Ababa"
 *             subCity: "Bole"
 *             woreda: "03"
 *             kebele: "12"
 *             houseNumber: "1234"
 *             managerId: "123e4567-e89b-12d3-a456-426614174001"
 *             status: "ACTIVE"
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/WarehouseDetail'
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
 *       404:
 *         description: Branch not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Warehouse code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  validate(createWarehouseSchema),
  requirePermission("warehouses:create"),
  addWarehouse,
);

/**
 * @swagger
 * /api/v1/warehouses/{id}:
 *   get:
 *     tags: [06-branches-warehouses]
 *     summary: Get warehouse by ID
 *     description: Retrieve detailed information for a specific warehouse.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/WarehouseDetail'
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
 *         description: Warehouse not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", requirePermission("warehouses:read"), getWarehouse);

/**
 * @swagger
 * /api/v1/warehouses/{id}:
 *   patch:
 *     tags: [06-branches-warehouses]
 *     summary: Update a warehouse
 *     description: Update warehouse details.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWarehouseRequest'
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/WarehouseDetail'
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
 *       404:
 *         description: Warehouse or branch not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Warehouse code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id",
  validate(updateWarehouseSchema),
  requirePermission("warehouses:update"),
  modifyWarehouse,
);

/**
 * @swagger
 * /api/v1/warehouses/{id}:
 *   delete:
 *     tags: [06-branches-warehouses]
 *     summary: Delete a warehouse
 *     description: Soft-delete a warehouse by ID. The warehouse will be marked as archived and excluded from future listings.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     responses:
 *       204:
 *         description: Warehouse deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Warehouse not found
 *         content:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  requirePermission("warehouses:delete"),
  removeWarehouse,
);

export default router;

