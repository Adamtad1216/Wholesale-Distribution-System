import { Router } from 'express';
import * as docController from './document.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * /api/v1/documents/types:
 *   post:
 *     summary: Create a Document Type (e.g. SUPPLIER_INVOICE)
 *     tags: [18 - Documents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created Document Type
 *   get:
 *     summary: Get all Document Types
 *     tags: [18 - Documents]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of Document Types
 */
router.post('/types', docController.createDocumentType);
router.get('/types', docController.getDocumentTypes);

/**
 * @swagger
 * /api/v1/documents:
 *   post:
 *     summary: Attach a Document (e.g. to a Goods Receipt)
 *     tags: [18 - Documents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentTypeId:
 *                 type: string
 *               entityType:
 *                 type: string
 *                 example: GOODS_RECEIPT
 *               entityId:
 *                 type: string
 *               fileUrl:
 *                 type: string
 *               fileName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document attached
 */
router.post('/', docController.createDocument);

/**
 * @swagger
 * /api/v1/documents/{id}/status:
 *   patch:
 *     summary: Update Document Status (e.g. Finance Approves)
 *     tags: [18 - Documents]
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
 *                 example: APPROVED
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', docController.updateDocumentStatus);

export default router;
