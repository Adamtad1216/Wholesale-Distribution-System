import { Router } from 'express';
import * as grController from './goods-receipt.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * /api/v1/goods-receipts:
 *   post:
 *     summary: Create a Goods Receipt (Receiving Items)
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
 *         description: Goods Receipt created and stock updated
 */
router.post('/', grController.createGoodsReceipt);

/**
 * @swagger
 * /api/v1/goods-receipts:
 *   get:
 *     summary: Get all Goods Receipts
 *     tags: [03 - Procurement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of goods receipts
 */
router.get('/', grController.getGoodsReceipts);

/**
 * @swagger
 * /api/v1/goods-receipts/{id}:
 *   get:
 *     summary: Get Goods Receipt by ID
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
 *         description: Goods Receipt details
 */
router.get('/:id', grController.getGoodsReceiptById);

export default router;
