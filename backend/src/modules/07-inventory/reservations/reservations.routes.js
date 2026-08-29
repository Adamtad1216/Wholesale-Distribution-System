import { Router } from 'express';
import {
  listReservations,
  addReservation,
  releaseStockReservation,
  removeReservation,
} from './reservations.controller.js';
import {
  reservationQuerySchema,
  createReservationSchema,
  releaseReservationSchema,
} from './reservations.validation.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/permission.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/inventory/reservations:
 *   get:
 *     tags: [07-inventory]
 *     summary: List stock reservations
 *     description: Retrieve a paginated list of stock reservations with optional filtering.
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
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by warehouse ID
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product ID
 *       - in: query
 *         name: salesOrderId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sales order ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [RESERVED, PARTIALLY_FULFILLED, FULFILLED, RELEASED, CANCELLED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of stock reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StockReservation'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
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
  '/',
  validate(reservationQuerySchema),
  requirePermission('inventory:reservations:read'),
  listReservations,
);

/**
 * @swagger
 * /api/v1/inventory/reservations:
 *   post:
 *     tags: [07-inventory]
 *     summary: Create stock reservation
 *     description: Create a new stock reservation for a sales order.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [salesOrderId, warehouseId, productId, quantity]
 *             properties:
 *               salesOrderId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174002
 *               quantity:
 *                 type: number
 *                 example: 10
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/StockReservation'
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
 */
router.post(
  '/',
  validate(createReservationSchema),
  requirePermission('inventory:reservations:create'),
  addReservation,
);

/**
 * @swagger
 * /api/v1/inventory/reservations/{id}/release:
 *   post:
 *     tags: [07-inventory]
 *     summary: Release stock reservation
 *     description: Release a previously reserved stock.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock reservation ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 example: 5
 *                 description: Quantity to release (partial release if less than reserved)
 *     responses:
 *       200:
 *         description: Reservation released successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/StockReservation'
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
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/:id/release',
  validate(releaseReservationSchema),
  requirePermission('inventory:reservations:release'),
  releaseStockReservation,
);

/**
 * @swagger
 * /api/v1/inventory/reservations/{id}:
 *   delete:
 *     tags: [07-inventory]
 *     summary: Delete stock reservation
 *     description: Soft-delete (archive) a stock reservation and release reserved quantity.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stock reservation ID
 *     responses:
 *       200:
 *         description: Reservation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Stock reservation deleted successfully
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
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  requirePermission('inventory:reservations:delete'),
  removeReservation,
);

export default router;
