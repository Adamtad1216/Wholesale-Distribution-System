import { Router } from "express";
import {
  listJobSpecifications,
  getJobSpecification,
  addJobSpecification,
  modifyJobSpecification,
  removeJobSpecification,
} from "./jobSpecifications.controller.js";
import {
  jobSpecificationQuerySchema,
  createJobSpecificationSchema,
  updateJobSpecificationSchema,
} from "./jobSpecifications.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/job-specifications:
 *   get:
 *     tags: [01-identity-access]
 *     summary: List job specifications
 *     description: Retrieve a paginated list of job specifications with optional filtering.
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
 *         description: Search by code, title, or description
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of job specifications
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
  validate(jobSpecificationQuerySchema),
  requirePermission("jobSpecifications:read"),
  listJobSpecifications,
);

/**
 * @swagger
 * /api/v1/job-specifications:
 *   post:
 *     tags: [01-identity-access]
 *     summary: Create a job specification
 *     description: Create a new job specification for employee classification.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJobSpecificationRequest'
 *           example:
 *             code: "JANITOR"
 *             title: "Janitor"
 *             description: "Responsible for cleaning and maintenance"
 *             department: "Facilities"
 *             status: "ACTIVE"
 *     responses:
 *       201:
 *         description: Job specification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/JobSpecificationDetail'
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
 *         description: Job specification code or title already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  validate(createJobSpecificationSchema),
  requirePermission("jobSpecifications:create"),
  addJobSpecification,
);

/**
 * @swagger
 * /api/v1/job-specifications/{id}:
 *   get:
 *     tags: [01-identity-access]
 *     summary: Get job specification by ID
 *     description: Retrieve detailed information for a specific job specification.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job specification ID
 *     responses:
 *       200:
 *         description: Job specification details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/JobSpecificationDetail'
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
 *         description: Job specification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", requirePermission("jobSpecifications:read"), getJobSpecification);

/**
 * @swagger
 * /api/v1/job-specifications/{id}:
 *   patch:
 *     tags: [01-identity-access]
 *     summary: Update a job specification
 *     description: Update job specification details.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job specification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateJobSpecificationRequest'
 *     responses:
 *       200:
 *         description: Job specification updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/JobSpecificationDetail'
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
 *         description: Job specification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Job specification code or title already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id",
  validate(updateJobSpecificationSchema),
  requirePermission("jobSpecifications:update"),
  modifyJobSpecification,
);

/**
 * @swagger
 * /api/v1/job-specifications/{id}:
 *   delete:
 *     tags: [01-identity-access]
 *     summary: Delete a job specification
 *     description: Soft-delete a job specification by ID.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job specification ID
 *     responses:
 *       204:
 *         description: Job specification deleted successfully
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
 *         description: Job specification not found
 *         content:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  requirePermission("jobSpecifications:delete"),
  removeJobSpecification,
);

export default router;

