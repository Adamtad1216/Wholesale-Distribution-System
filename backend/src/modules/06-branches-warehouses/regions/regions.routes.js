import { Router } from "express";
import {
  listRegions,
  getRegion,
  addRegion,
  modifyRegion,
  removeRegion,
} from "./regions.controller.js";
import {
  regionQuerySchema,
  createRegionSchema,
  updateRegionSchema,
} from "./regions.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/regions:
 *   get:
 *     tags: [06-branches-warehouses]
 *     summary: List regions
 *     description: Retrieve a paginated list of regions with optional filtering.
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
 *         description: Search by name, code, or description
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of regions
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
  validate(regionQuerySchema),
  requirePermission("regions:read"),
  listRegions,
);

/**
 * @swagger
 * /api/v1/regions:
 *   post:
 *     tags: [06-branches-warehouses]
 *     summary: Create a region
 *     description: Create a new region for the wholesale distribution system.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRegionRequest'
 *           example:
 *             name: "Addis Ababa"
 *             code: "ADD"
 *             description: "Capital city of Ethiopia"
 *             isActive: true
 *     responses:
 *       201:
 *         description: Region created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/RegionDetail'
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
 *       409:
 *         description: Region code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  validate(createRegionSchema),
  requirePermission("regions:create"),
  addRegion,
);

/**
 * @swagger
 * /api/v1/regions/{id}:
 *   get:
 *     tags: [06-branches-warehouses]
 *     summary: Get region by ID
 *     description: Retrieve detailed information for a specific region.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Region ID
 *     responses:
 *       200:
 *         description: Region details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/RegionDetail'
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
 *         description: Region not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", requirePermission("regions:read"), getRegion);

/**
 * @swagger
 * /api/v1/regions/{id}:
 *   patch:
 *     tags: [06-branches-warehouses]
 *     summary: Update a region
 *     description: Update region details.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Region ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRegionRequest'
 *     responses:
 *       200:
 *         description: Region updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/RegionDetail'
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
 *         description: Region not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Region code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id",
  validate(updateRegionSchema),
  requirePermission("regions:update"),
  modifyRegion,
);

/**
 * @swagger
 * /api/v1/regions/{id}:
 *   delete:
 *     tags: [06-branches-warehouses]
 *     summary: Delete a region
 *     description: Soft-delete a region by ID. The region will be marked as inactive and excluded from future active listings.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Region ID
 *     responses:
 *       204:
 *         description: Region deleted successfully
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
 *         description: Region not found
 *         content:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  requirePermission("regions:delete"),
  removeRegion,
);

export default router;

