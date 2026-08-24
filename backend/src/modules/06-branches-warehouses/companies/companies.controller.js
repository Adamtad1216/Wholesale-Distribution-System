import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent, sendError } from "../../../utils/api-response.js";
import { companyIdSchema } from './companies.validation.js';
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from './companies.service.js';

export async function listCompanies(req, res, next) {
  try {
    const filters = { ...req.query };
    const { companies, meta } = await getCompanies(filters);
    sendPaginatedSuccess(res, companies, meta);
  } catch (err) {
    next(err);
  }
}

export async function getCompany(req, res, next) {
  try {
    const idResult = companyIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid company ID', 400);
    }
    const company = await getCompanyById(idResult.data.id);
    sendSuccess(res, company);
  } catch (err) {
    next(err);
  }
}

export async function addCompany(req, res, next) {
  try {
    const company = await createCompany(req.body, req.user.id, req);
    sendCreated(res, company);
  } catch (err) {
    next(err);
  }
}

export async function modifyCompany(req, res, next) {
  try {
    const idResult = companyIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid company ID', 400);
    }
    const company = await updateCompany(idResult.data.id, req.body, req.user.id, req);
    sendSuccess(res, company);
  } catch (err) {
    next(err);
  }
}

export async function removeCompany(req, res, next) {
  try {
    const idResult = companyIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid company ID', 400);
    }
    await deleteCompany(idResult.data.id, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

