import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent, sendError } from '../../utils/api-response.js';
import { customerIdSchema } from './customers.validation.js';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from './customers.service.js';

export async function listCustomers(req, res, next) {
  try {
    const filters = { ...req.query };
    const { customers, meta } = await getCustomers(filters);
    sendPaginatedSuccess(res, customers, meta);
  } catch (err) {
    next(err);
  }
}

export async function getCustomer(req, res, next) {
  try {
    const idResult = customerIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid customer ID', 400);
    }
    const customer = await getCustomerById(idResult.data.id);
    sendSuccess(res, customer);
  } catch (err) {
    next(err);
  }
}

export async function addCustomer(req, res, next) {
  try {
    const customer = await createCustomer(req.body, req.user.id, req);
    sendCreated(res, customer);
  } catch (err) {
    next(err);
  }
}

export async function modifyCustomer(req, res, next) {
  try {
    const idResult = customerIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid customer ID', 400);
    }
    const customer = await updateCustomer(idResult.data.id, req.body, req.user.id, req);
    sendSuccess(res, customer);
  } catch (err) {
    next(err);
  }
}

export async function removeCustomer(req, res, next) {
  try {
    const idResult = customerIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid customer ID', 400);
    }
    await deleteCustomer(idResult.data.id, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
