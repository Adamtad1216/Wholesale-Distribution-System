import { Router } from 'express';
import * as supplierController from './supplier.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * /api/v1/suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [02 - Suppliers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Supplier created successfully
 */
router.post('/', supplierController.createSupplier);

/**
 * @swagger
 * /api/v1/suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [02 - Suppliers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of suppliers
 */
router.get('/', supplierController.getSuppliers);

/**
 * @swagger
 * /api/v1/suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [02 - Suppliers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier details
 */
router.get('/:id', supplierController.getSupplierById);

/**
 * @swagger
 * /api/v1/suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [02 - Suppliers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 */
router.put('/:id', supplierController.updateSupplier);

/**
 * @swagger
 * /api/v1/suppliers/{id}:
 *   delete:
 *     summary: Archive supplier
 *     tags: [02 - Suppliers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier archived successfully
 */
router.delete('/:id', supplierController.archiveSupplier);

export default router;
