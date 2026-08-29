import { sendPaginatedSuccess, sendCreated, sendDeleted, sendError } from '../../../utils/api-response.js';
import {
  createMovement,
  getMovements,
  deleteMovement,
} from './movements.service.js';
import { stockIdSchema } from '../stock/stock.validation.js';

export async function listMovements(req, res, next) {
  try {
    const { movements, meta } = await getMovements(req.query);
    sendPaginatedSuccess(res, movements, meta);
  } catch (err) {
    next(err);
  }
}

export async function addMovement(req, res, next) {
  try {
    const movement = await createMovement(req.body, req.user.id, req);
    sendCreated(res, movement);
  } catch (err) {
    next(err);
  }
}

export async function removeMovement(req, res, next) {
  try {
    const idResult = stockIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid movement ID', 400);
    await deleteMovement(idResult.data.id, req.user.id, req);
    sendDeleted(res, 'Stock movement deleted successfully');
  } catch (err) {
    next(err);
  }
}
