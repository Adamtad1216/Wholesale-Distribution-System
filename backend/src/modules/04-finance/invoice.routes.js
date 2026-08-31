import { Router } from 'express';
import {
  createFromOrder,
  createFromDelivery,
  getInvoices,
  getInvoiceById
} from './invoice.controller.js';

const router = Router();

// Routes for Invoice generation
/**
 * @openapi
 * /api/v1/invoices/from-order:
 *   post:
 *     summary: Create an Upfront Invoice from a Sales Order (Pre-Payment Flow)
 *     tags: [04 - Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salesOrderId
 *             properties:
 *               salesOrderId:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-of-sales-order-here"
 *     responses:
 *       201:
 *         description: Upfront invoice created successfully
 */
router.post('/from-order', createFromOrder);

/**
 * @openapi
 * /api/v1/invoices/from-delivery:
 *   post:
 *     summary: Create an Invoice from a Delivery (Post-Delivery Flow)
 *     tags: [04 - Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveryId
 *             properties:
 *               deliveryId:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-of-delivery-here"
 *     responses:
 *       201:
 *         description: Invoice created based on delivery successfully
 */
router.post('/from-delivery', createFromDelivery);

// General Invoice Retrieval
/**
 * @openapi
 * /api/v1/invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [04 - Finance]
 *     responses:
 *       200:
 *         description: List of all invoices
 */
router.get('/', getInvoices);

/**
 * @openapi
 * /api/v1/invoices/{id}:
 *   get:
 *     summary: Get a specific invoice by ID
 *     tags: [04 - Finance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detailed invoice data
 */
router.get('/:id', getInvoiceById);

export default router;
