import { sendPaginatedSuccess, sendCreated, sendSuccess, sendUpdated, sendDeleted } from '../../../utils/api-response.js';
import {
  createTransfer,
  getTransfers,
  getTransferById,
  updateTransfer,
  deleteTransfer,
} from './transfers.service.js';

export async function listTransfers(req, res, next) {
  try {
    const { transfers, meta } = await getTransfers(req.query, req.user);
    sendPaginatedSuccess(res, transfers, meta);
  } catch (err) {
    next(err);
  }
}

export async function getTransfer(req, res, next) {
  try {
    const transfer = await getTransferById(req.params.id, req.query, req.user);
    sendSuccess(res, transfer);
  } catch (err) {
    next(err);
  }
}

export async function addTransfer(req, res, next) {
  try {
    const transfer = await createTransfer(req.body, req.user.id, req, req.user);
    sendCreated(res, transfer);
  } catch (err) {
    next(err);
  }
}

export async function modifyTransfer(req, res, next) {
  try {
    const transfer = await updateTransfer(req.params.id, req.body, req.user.id, req, req.user);
    sendUpdated(res, transfer, 'Stock transfer updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function removeTransfer(req, res, next) {
  try {
    await deleteTransfer(req.params.id, req.user.id, req, req.user);
    sendDeleted(res, 'Stock transfer deleted and stock reversed successfully');
  } catch (err) {
    next(err);
  }
}

