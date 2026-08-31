import express from 'express';
const router = express.Router();
import paymentController from './payment.controller.js';

/**
 * @openapi
 * /api/v1/payments/providers:
 *   get:
 *     summary: Get active payment providers and configurable payment methods
 *     tags: [04 - Finance]
 *     responses:
 *       200:
 *         description: List of payment providers and methods
 *   post:
 *     summary: Create a new payment provider
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
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Commercial Bank of Ethiopia"
 *               code:
 *                 type: string
 *                 example: "cbe_bank"
 *               type:
 *                 type: string
 *                 example: "MANUAL"
 *     responses:
 *       201:
 *         description: Payment provider created successfully
 */
router.get('/providers', (req, res) => paymentController.getProviders(req, res));
router.post('/providers', (req, res) => paymentController.createProvider(req, res));

/**
 * @openapi
 * /api/v1/payments/providers/{id}:
 *   put:
 *     summary: Update an existing payment provider
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Provider updated successfully
 *   delete:
 *     summary: Delete a payment provider
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
 *         description: Provider deleted successfully
 */
router.put('/providers/:id', (req, res) => paymentController.updateProvider(req, res));
router.delete('/providers/:id', (req, res) => paymentController.deleteProvider(req, res));

/**
 * @openapi
 * /api/v1/payments/providers/{providerId}/methods:
 *   post:
 *     summary: Add a new payment method option to a provider
 *     tags: [04 - Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: "CBE Birr Transfer"
 *               code:
 *                 type: string
 *                 example: "CBE_TRANSFER"
 *               requiresProof:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Payment method option created successfully
 */
router.post('/providers/:providerId/methods', (req, res) => paymentController.createMethodOption(req, res));

/**
 * @openapi
 * /api/v1/payments/methods/{id}:
 *   put:
 *     summary: Update an existing payment method option
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               requiresProof:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Option updated successfully
 *   delete:
 *     summary: Delete a payment method option
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
 *         description: Option deleted successfully
 */
router.put('/methods/:id', (req, res) => paymentController.updateMethodOption(req, res));
router.delete('/methods/:id', (req, res) => paymentController.deleteMethodOption(req, res));

/**
 * @openapi
 * /api/v1/payments/initialize:
 *   post:
 *     summary: Initialize a new payment transaction session (Online or Manual)
 *     description: |
 *       Initializes a payment session linked to a PostgreSQL `Order` or standalone test transaction.
 *       - If `orderId` is provided, the backend validates it against the `Order` table and automatically derives `amount` if not explicitly specified.
 *     tags:
 *       - 04 - Finance
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [chapa, telebirr, bank_transfer]
 *                 default: chapa
 *                 description: Payment gateway provider (chapa, telebirr, or bank_transfer)
 *                 example: chapa
 *               orderId:
 *                 type: string
 *                 description: ID or Order Number of the order to pay for (Amount will be auto-derived if omitted)
 *                 example: cmt62860c0000f8q52spccqbm
 *               amount:
 *                 type: number
 *                 description: Payment amount (Required if orderId is not provided)
 *                 example: 900.00
 *               email:
 *                 type: string
 *                 example: customer@example.com
 *               firstName:
 *                 type: string
 *                 example: Abebe
 *               lastName:
 *                 type: string
 *                 example: Bikila
 *           examples:
 *             OrderByOrderId:
 *               summary: Initialize Payment by Order ID (Auto-derives amount)
 *               value:
 *                 provider: "chapa"
 *                 orderId: "cmt62860c0000f8q52spccqbm"
 *                 email: "customer@example.com"
 *                 firstName: "Abebe"
 *                 lastName: "Bikila"
 *             StandalonePayment:
 *               summary: Initialize Standalone Custom Payment
 *               value:
 *                 provider: "chapa"
 *                 amount: 500.00
 *                 email: "customer@example.com"
 *                 firstName: "Abebe"
 *                 lastName: "Bikila"
 *     responses:
 *       200:
 *         description: Payment session initialized successfully
 *       400:
 *         description: Missing orderId or amount
 *       404:
 *         description: Order not found
 */
router.post('/initialize', (req, res) => paymentController.initialize(req, res));

/**
 * @openapi
 * /api/v1/payments/verify/{txRef}:
 *   get:
 *     summary: Verify transaction status by transaction reference (txRef)
 *     tags:
 *       - 04 - Finance
 *     parameters:
 *       - in: path
 *         name: txRef
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           default: chapa
 *     responses:
 *       200:
 *         description: Payment status verification
 */
router.get('/verify/:txRef', (req, res) => paymentController.verify(req, res));

/**
 * @openapi
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Gateway Webhook (Idempotent Event Log)
 *     tags:
 *       - 04 - Finance
 *     responses:
 *       200:
 *         description: Webhook acknowledged and logged
 */
router.post('/webhook', (req, res) => paymentController.webhook(req, res));

/**
 * @openapi
 * /api/v1/payments/{id}/proof:
 *   post:
 *     summary: Upload manual payment receipt proof (Bank Transfer / Receipt)
 *     tags:
 *       - 04 - Finance
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
 *             required:
 *               - fileUrl
 *             properties:
 *               fileUrl:
 *                 type: string
 *                 example: https://storage.example.com/receipts/bank-ref-1001.jpg
 *               fileName:
 *                 type: string
 *                 example: bank-receipt.jpg
 *     responses:
 *       201:
 *         description: Payment proof receipt uploaded successfully
 */
router.post('/:id/proof', (req, res) => paymentController.uploadProof(req, res));

/**
 * @openapi
 * /api/v1/payments/proof/{proofId}/verify:
 *   patch:
 *     summary: Employee approve or reject uploaded payment receipt proof
 *     tags:
 *       - 04 - Finance
 *     parameters:
 *       - in: path
 *         name: proofId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *                 example: true
 *               rejectionReason:
 *                 type: string
 *                 example: Image blurry, reference number unreadable
 *     responses:
 *       200:
 *         description: Proof verification status updated
 */
router.patch('/proof/:proofId/verify', (req, res) => paymentController.verifyProof(req, res));

/**
 * @openapi
 * /api/v1/payments/{id}/refund:
 *   post:
 *     summary: Process full or partial refund for a payment
 *     tags:
 *       - 04 - Finance
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
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100.00
 *               reason:
 *                 type: string
 *                 example: Customer returned item
 *     responses:
 *       200:
 *         description: Refund record created and payment status updated
 */
router.post('/:id/refund', (req, res) => paymentController.processRefund(req, res));

/**
 * @openapi
 * /api/v1/payments/{id}/history:
 *   get:
 *     summary: Get complete payment history across all 8 tables (attempts, proofs, refunds, webhooks, audit logs)
 *     tags:
 *       - 04 - Finance
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detailed payment entity history
 */
router.get('/:id/history', (req, res) => paymentController.getHistory(req, res));

export default router;
