import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent, sendError } from "../../../utils/api-response.js";
import { jobSpecificationIdSchema } from './jobSpecifications.validation.js';
import {
  createJobSpecification,
  getJobSpecifications,
  getJobSpecificationById,
  updateJobSpecification,
  deleteJobSpecification,
} from './jobSpecifications.service.js';

export async function listJobSpecifications(req, res, next) {
  try {
    const filters = { ...req.query };
    const { jobSpecifications, meta } = await getJobSpecifications(filters);
    sendPaginatedSuccess(res, jobSpecifications, meta);
  } catch (err) {
    next(err);
  }
}

export async function getJobSpecification(req, res, next) {
  try {
    const idResult = jobSpecificationIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid job specification ID', 400);
    }
    const jobSpec = await getJobSpecificationById(idResult.data.id);
    sendSuccess(res, jobSpec);
  } catch (err) {
    next(err);
  }
}

export async function addJobSpecification(req, res, next) {
  try {
    const jobSpec = await createJobSpecification(req.body, req.user.id, req);
    sendCreated(res, jobSpec);
  } catch (err) {
    next(err);
  }
}

export async function modifyJobSpecification(req, res, next) {
  try {
    const idResult = jobSpecificationIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid job specification ID', 400);
    }
    const jobSpec = await updateJobSpecification(idResult.data.id, req.body, req.user.id, req);
    sendSuccess(res, jobSpec);
  } catch (err) {
    next(err);
  }
}

export async function removeJobSpecification(req, res, next) {
  try {
    const idResult = jobSpecificationIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid job specification ID', 400);
    }
    await deleteJobSpecification(idResult.data.id, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

