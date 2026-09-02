import { Router } from 'express';
import * as paymentTermsController from './payment-terms.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: 04 - Finance
 *   description: Invoices, Payments, Credits & Payment Terms Management
 */

/**
 * @swagger
 * /api/v1/payment-terms:
 *   get:
 *     summary: List all active payment terms (e.g. Net 15, Net 30, COD)
 *     tags: [04 - Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment terms
 */
router.get('/', paymentTermsController.getAllPaymentTerms);

/**
 * @swagger
 * /api/v1/payment-terms/{id}:
 *   get:
 *     summary: Get payment term by ID
 *     tags: [04 - Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment term details
 *       404:
 *         description: Payment term not found
 */
router.get('/:id', paymentTermsController.getPaymentTermById);

/**
 * @swagger
 * /api/v1/payment-terms:
 *   post:
 *     summary: Create a new payment term (e.g. Net 30 Days)
 *     tags: [04 - Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - days
 *             properties:
 *               name:
 *                 type: string
 *                 example: Net 30 Days
 *               days:
 *                 type: integer
 *                 example: 30
 *               description:
 *                 type: string
 *                 example: Payment due within 30 calendar days from invoice date
 *     responses:
 *       201:
 *         description: Payment term created
 *       400:
 *         description: Invalid parameters
 */
router.post('/', paymentTermsController.createPaymentTerm);

export default router;
