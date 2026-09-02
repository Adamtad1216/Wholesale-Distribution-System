import { Router } from "express";
import {
  listEmployees,
  getEmployee,
  addEmployee,
  modifyEmployee,
  removeEmployee,
} from "./employees.controller.js";
import {
  employeeQuerySchema,
  createEmployeeSchema,
  updateEmployeeSchema,
} from "./employees.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requirePermission } from "../../../middleware/permission.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/employees:
 *   get:
 *     tags: ["01 - Employees"]
 *     summary: List employees
 *     description: Retrieve a paginated list of employees with optional filtering.
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
 *         description: Search by employee code or person name
 *       - in: query
 *         name: jobSpecificationId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by job specification ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: hasUserAccount
 *         schema:
 *           type: boolean
 *         description: Filter by whether employee has a user account
 *     responses:
 *       200:
 *         description: List of employees
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
  validate(employeeQuerySchema),
  requirePermission("employees:read"),
  listEmployees,
);

/**
 * @swagger
 * /api/v1/employees:
 *   post:
 *     tags: ["01 - Employees"]
 *     summary: Create an employee
 *     description: |
 *       Create a new employee. Set `needsUserAccount` to `true` to create a user account for this employee.
 *       If `username` is provided along with `needsUserAccount: true`, the user will be created as ACTIVE and assigned the specified roles.
 *       If `password` is not provided, a password reset link will be sent to the employee's email.
 *       If `username` is not provided, an invitation email will be sent instead and the user must accept it.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployeeRequest'
 *           examples:
 *             employeeWithoutUser:
 *               summary: Employee without user account
 *               value:
 *                 firstName: "Abebe"
 *                 lastName: "Kebede"
 *                 hireDate: "2024-01-15"
 *                 branchId: "123e4567-e89b-12d3-a456-426614174000"
 *                 jobSpecificationIds: ["123e4567-e89b-12d3-a456-426614174000"]
 *                 status: "ACTIVE"
 *                 needsUserAccount: false
 *             employeeWithUserAndPassword:
 *               summary: Employee with user account and password
 *               value:
 *                 firstName: "Abebe"
 *                 lastName: "Kebede"
 *                 email: "abebe@example.com"
 *                 hireDate: "2024-01-15"
 *                 branchId: "123e4567-e89b-12d3-a456-426614174000"
 *                 status: "ACTIVE"
 *                 needsUserAccount: true
 *                 username: "abebe.kebede"
 *                 password: "SecurePass123!"
 *                 roleIds: ["9afa885b-a72f-4012-9092-8e26cb864bfd"]
 *                 jobSpecificationIds: ["123e4567-e89b-12d3-a456-426614174000"]
 *             employeeWithUserAndResetLink:
 *               summary: Employee with user account (reset link sent)
 *               value:
 *                 firstName: "Abebe"
 *                 lastName: "Kebede"
 *                 email: "abebe@example.com"
 *                 hireDate: "2024-01-15"
 *                 branchId: "123e4567-e89b-12d3-a456-426614174000"
 *                 status: "ACTIVE"
 *                 needsUserAccount: true
 *                 username: "abebe.kebede"
 *                 roleIds: ["9afa885b-a72f-4012-9092-8e26cb864bfd"]
 *                 jobSpecificationIds: ["123e4567-e89b-12d3-a456-426614174000"]
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/EmployeeDetail'
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
 *         description: Email or employee code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  validate(createEmployeeSchema),
  requirePermission("employees:create"),
  addEmployee,
);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   get:
 *     tags: ["01 - Employees"]
 *     summary: Get employee by ID
 *     description: Retrieve detailed information for a specific employee including person and job specification.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/EmployeeDetail'
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
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", requirePermission("employees:read"), getEmployee);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   patch:
 *     tags: ["01 - Employees"]
 *     summary: Update an employee
 *     description: Update employee details. If switching to needsUserAccount=true, an invitation will be sent.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEmployeeRequest'
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/EmployeeDetail'
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
 *         description: Employee or job specification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email or employee code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id",
  validate(updateEmployeeSchema),
  requirePermission("employees:update"),
  modifyEmployee,
);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   delete:
 *     tags: ["01 - Employees"]
 *     summary: Delete an employee
 *     description: Soft-delete an employee by ID. The employee will be marked as archived and excluded from future listings.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *     responses:
 *       204:
 *         description: Employee deleted successfully
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
 *         description: Employee not found
 *         content:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  requirePermission("employees:delete"),
  removeEmployee,
);

export default router;

