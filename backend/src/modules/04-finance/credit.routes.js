import { Router } from 'express';
import * as creditController from './credit.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * /api/v1/credits/manual:
 *   post:
 *     summary: Issue a manual store credit to a customer (Manager / Direct Grant)
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
 *               - customerId
 *               - amount
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 example: 500
 *               reason:
 *                 type: string
 *                 example: "Goodwill promotional store credit granted by manager"
 *     responses:
 *       201:
 *         description: Manual credit issued successfully
 */
router.post('/manual', creditController.createManualCredit);

/**
 * @swagger
 * /api/v1/credits/from-return:
 *   post:
 *     summary: Issue store credit from a Sales Return (Option 2 for product returns)
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
 *               - salesReturnId
 *               - customerId
 *               - amount
 *             properties:
 *               salesReturnId:
 *                 type: string
 *                 format: uuid
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 example: 250
 *               reason:
 *                 type: string
 *                 example: "Credit voucher for damaged goods return"
 *     responses:
 *       201:
 *         description: Sales Return credit issued successfully
 */
router.post('/from-return', creditController.createCreditFromReturn);

/**
 * @swagger
 * /api/v1/credits:
 *   get:
 *     summary: Get all store credits with optional customerId / status filtering
 *     tags: [04 - Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of credits
 */
router.get('/', creditController.getAllCredits);

/**
 * @swagger
 * /api/v1/credits/customer/{customerId}:
 *   get:
 *     summary: Get all active credits and total available balance for a specific customer
 *     tags: [04 - Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Customer store credit summary
 */
router.get('/customer/:customerId', creditController.getCustomerCredits);

/**
 * @swagger
 * /api/v1/credits/{id}/apply:
 *   post:
 *     summary: Apply store credit balance toward an open invoice
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
 *             required:
 *               - invoiceId
 *               - amount
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 example: 100
 *     responses:
 *       200:
 *         description: Credit successfully applied to invoice balance
 */
router.post('/:id/apply', creditController.applyCreditToInvoice);

/**
 * @swagger
 * /api/v1/credits/{id}/history:
 *   get:
 *     summary: Get complete audit ledger for a credit (Grant record & invoice allocations)
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
 *         description: Full credit audit history including allocations
 *       404:
 *         description: Credit not found
 */
router.get('/:id/history', creditController.getCreditHistory);

/**
 * @swagger
 * /api/v1/credits/customer/{customerId}/summary:
 *   get:
 *     summary: Get complete Trade Credit Limit (Debt) and Store Credit balance summary for a customer
 *     tags: [04 - Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Complete customer credit facility summary
 */
router.get('/customer/:customerId/summary', creditController.getCustomerCreditSummary);

/**
 * @swagger
 * /api/v1/credits/customer/{customerId}/validate-limit:
 *   post:
 *     summary: Validate whether a purchase amount is within the customer's available credit limit
 *     tags: [04 - Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 4000
 *     responses:
 *       200:
 *         description: Purchase allowed under available credit limit
 *       400:
 *         description: Purchase exceeds credit limit
 */
router.post('/customer/:customerId/validate-limit', creditController.validateCreditLimit);

export default router;
