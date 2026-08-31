import { Router } from 'express';
import * as poController from './purchase-order.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * /api/v1/purchase-orders:
 *   post:
 *     summary: Create a new Purchase Order
 *     tags: [03 - Procurement]
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
 *         description: Purchase Order created successfully
 */
router.post('/', poController.createPurchaseOrder);

/**
 * @swagger
 * /api/v1/purchase-orders:
 *   get:
 *     summary: Get all Purchase Orders
 *     tags: [03 - Procurement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchase orders
 */
router.get('/', poController.getPurchaseOrders);

/**
 * @swagger
 * /api/v1/purchase-orders/{id}:
 *   get:
 *     summary: Get Purchase Order by ID
 *     tags: [03 - Procurement]
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
 *         description: Purchase Order details
 */
router.get('/:id', poController.getPurchaseOrderById);

/**
 * @swagger
 * /api/v1/purchase-orders/{id}/approve:
 *   patch:
 *     summary: Approve a Purchase Order
 *     tags: [03 - Procurement]
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
 *         description: Purchase Order approved successfully
 */
router.patch('/:id/approve', poController.approvePurchaseOrder);

/**
 * @swagger
 * /api/v1/purchase-orders/{id}/status:
 *   patch:
 *     summary: Update Purchase Order status
 *     tags: [03 - Procurement]
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
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status', poController.updateStatus);

export default router;
