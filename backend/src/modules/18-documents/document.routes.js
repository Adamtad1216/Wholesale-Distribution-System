import { Router } from 'express';
import * as docController from './document.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';

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
router.get('/types', docController.getDocumentTypes);
router.post('/types', docController.createDocumentType);

router.get('/', docController.getDocuments);
router.post('/', docController.createDocument);
router.delete('/:id', docController.deleteDocument);

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

/**
 * @swagger
 * /api/v1/documents/upload:
 *   post:
 *     summary: Upload a File to Cloudinary
 *     tags: [18 - Documents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *                 default: wholesale_docs
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/upload', uploadMiddleware.single('file'), docController.uploadDocumentFile);

export default router;
