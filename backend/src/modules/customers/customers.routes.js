import { Router } from "express";
import {
  listCustomers,
  getCustomer,
  addCustomer,
  modifyCustomer,
  removeCustomer,
} from "./customers.controller.js";
import {
  customerQuerySchema,
  createCustomerSchema,
  updateCustomerSchema,
} from "./customers.validation.js";
import { validate } from "../../middleware/validation.middleware.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     tags: [Customers]
 *     summary: List customers
 *     description: Retrieve a paginated list of customers with optional filtering.
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
 *         description: Search by customer code, person name, or organization name
 *       - in: query
 *         name: customerType
 *         schema:
 *           type: string
 *           enum: [PERSON, ORGANIZATION]
 *         description: Filter by customer type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: salesRepId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sales representative ID
 *       - in: query
 *         name: paymentTermsId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by payment terms ID
 *     responses:
 *       200:
 *         description: List of customers
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
  validate(customerQuerySchema),
  requirePermission("customers:read"),
  listCustomers,
);

/**
 * @swagger
 * /api/v1/customers:
 *   post:
 *     tags: [Customers]
 *     summary: Create a customer
 *     description: Create a new PERSON or ORGANIZATION customer. Use the customerType discriminator to choose the type.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/PersonCustomerRequest'
 *               - $ref: '#/components/schemas/OrganizationCustomerRequest'
 *           examples:
 *             personCustomer:
 *               summary: Person Customer Example
 *               value:
 *                 customerType: "PERSON"
 *                 creditLimit: 5000
 *                 status: "ACTIVE"
 *                 person:
 *                   firstName: "John"
 *                   middleName: "M"
 *                   lastName: "Doe"
 *                   phone: "+251911111111"
 *                   email: "john.doe@example.com"
 *                   address: "Bole Road, Addis Ababa"
 *             organizationCustomer:
 *               summary: Organization Customer Example
 *               value:
 *                 customerType: "ORGANIZATION"
 *                 creditLimit: 10000
 *                 status: "ACTIVE"
 *                 organization:
 *                   name: "Acme Corporation"
 *                   registrationNumber: "REG-12345"
 *                   taxNumber: "TAX-67890"
 *                   phone: "+251922222222"
 *                   email: "info@acme.com"
 *                   address: "Addis Ababa, Ethiopia"
 *                   contacts:
 *                     - firstName: "Clone"
 *                       middleName: "T."
 *                       lastName: "Tech"
 *                       phone: "+251933333333"
 *                       email: "clone@gmail.com"
 *                       address: "Addis Ababa, Ethiopia"
 *                       isPrimary: true
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/CustomerDetail'
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
 *         description: Duplicate customer or identity conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  validate(createCustomerSchema),
  requirePermission("customers:create"),
  addCustomer,
);

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer by ID
 *     description: Retrieve detailed information for a specific customer including identity data.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/CustomerDetail'
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
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", requirePermission("customers:read"), getCustomer);

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   patch:
 *     tags: [Customers]
 *     summary: Update a customer
 *     description: Update customer details. Customer type cannot be changed after creation.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               creditLimit:
 *                 type: number
 *                 example: 7500
 *               paymentTermsId:
 *                 type: string
 *                 format: uuid
 *               assignedSalesRepId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 example: ACTIVE
 *               person:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: John
 *                   middleName:
 *                     type: string
 *                     example: M
 *                   lastName:
 *                     type: string
 *                     example: Doe
 *                   phone:
 *                     type: string
 *                     example: +251911111111
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: john@example.com
 *                   address:
 *                     type: string
 *                     example: Addis Ababa
 *               organization:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Acme Corporation
 *                   registrationNumber:
 *                     type: string
 *                     example: REG-12345
 *                   taxNumber:
 *                     type: string
 *                     example: TAX-67890
 *                   phone:
 *                     type: string
 *                     example: +251922222222
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: info@acme.com
 *                   address:
 *                     type: string
 *                     example: Addis Ababa
 *                   contacts:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                           example: Clone
 *                         lastName:
 *                           type: string
 *                           example: Tech
 *                         phone:
 *                           type: string
 *                           example: +251933333333
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: clone@example.com
 *                         position:
 *                           type: string
 *                           example: Manager
 *                         isPrimary:
 *                           type: boolean
 *                           example: true
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/CustomerDetail'
 *       400:
 *         description: Validation error or invalid operation (e.g., type change)
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
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id",
  validate(updateCustomerSchema),
  requirePermission("customers:update"),
  modifyCustomer,
);

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   delete:
 *     tags: [Customers]
 *     summary: Delete a customer
 *     description: Soft-delete a customer by ID. The customer will be marked as archived and excluded from future listings.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Customer ID
 *     responses:
 *       204:
 *         description: Customer deleted successfully
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
 *         description: Customer not found
 *         content:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  requirePermission("customers:delete"),
  removeCustomer,
);

export default router;
