import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent, sendError } from "../../../utils/api-response.js";
import { branchIdSchema } from './branches.validation.js';
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from './branches.service.js';

export async function listBranches(req, res, next) {
  try {
    const filters = { ...req.query };
    const { branches, meta } = await getBranches(filters);
    sendPaginatedSuccess(res, branches, meta);
  } catch (err) {
    next(err);
  }
}

export async function getBranch(req, res, next) {
  try {
    const idResult = branchIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid branch ID', 400);
    }
    const branch = await getBranchById(idResult.data.id);
    sendSuccess(res, branch);
  } catch (err) {
    next(err);
  }
}

export async function addBranch(req, res, next) {
  try {
    const branch = await createBranch(req.body, req.user.id, req);
    sendCreated(res, branch);
  } catch (err) {
    next(err);
  }
}

export async function modifyBranch(req, res, next) {
  try {
    const idResult = branchIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid branch ID', 400);
    }
    const branch = await updateBranch(idResult.data.id, req.body, req.user.id, req);
    sendSuccess(res, branch);
  } catch (err) {
    next(err);
  }
}

export async function removeBranch(req, res, next) {
  try {
    const idResult = branchIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid branch ID', 400);
    }
    await deleteBranch(idResult.data.id, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

