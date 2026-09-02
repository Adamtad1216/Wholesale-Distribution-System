import { sendSuccess, sendPaginatedSuccess, sendCreated, sendError, sendUpdated, sendDeleted } from '../../../utils/api-response.js';
import { reservationIdSchema } from './reservations.validation.js';
import {
  createReservation,
  getReservations,
  releaseReservation,
  deleteReservation,
} from './reservations.service.js';

export async function listReservations(req, res, next) {
  try {
    const { reservations, meta } = await getReservations(req.query, req.user);
    sendPaginatedSuccess(res, reservations, meta);
  } catch (err) {
    next(err);
  }
}

export async function addReservation(req, res, next) {
  try {
    const reservation = await createReservation(req.body, req.user.id, req, req.user);
    sendCreated(res, reservation);
  } catch (err) {
    next(err);
  }
}

export async function releaseStockReservation(req, res, next) {
  try {
    const idResult = reservationIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid reservation ID', 400);
    const reservation = await releaseReservation(idResult.data.id, req.body?.quantity, req.user.id, req, req.user);
    sendUpdated(res, reservation, 'Reservation released successfully');
  } catch (err) {
    next(err);
  }
}

export async function removeReservation(req, res, next) {
  try {
    const idResult = reservationIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid reservation ID', 400);
    await deleteReservation(idResult.data.id, req.user.id, req, req.user);
    sendDeleted(res, 'Stock reservation deleted successfully');
  } catch (err) {
    next(err);
  }
}
