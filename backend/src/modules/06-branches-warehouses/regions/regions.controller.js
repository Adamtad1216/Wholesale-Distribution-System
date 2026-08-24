import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent, sendError } from "../../../utils/api-response.js";
import { regionIdSchema } from './regions.validation.js';
import {
  createRegion,
  getRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
} from './regions.service.js';

export async function listRegions(req, res, next) {
  try {
    const filters = { ...req.query };
    const { regions, meta } = await getRegions(filters);
    sendPaginatedSuccess(res, regions, meta);
  } catch (err) {
    next(err);
  }
}

export async function getRegion(req, res, next) {
  try {
    const idResult = regionIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid region ID', 400);
    }
    const region = await getRegionById(idResult.data.id);
    sendSuccess(res, region);
  } catch (err) {
    next(err);
  }
}

export async function addRegion(req, res, next) {
  try {
    const region = await createRegion(req.body, req.user.id, req);
    sendCreated(res, region);
  } catch (err) {
    next(err);
  }
}

export async function modifyRegion(req, res, next) {
  try {
    const idResult = regionIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid region ID', 400);
    }
    const region = await updateRegion(idResult.data.id, req.body, req.user.id, req);
    sendSuccess(res, region);
  } catch (err) {
    next(err);
  }
}

export async function removeRegion(req, res, next) {
  try {
    const idResult = regionIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid region ID', 400);
    }
    await deleteRegion(idResult.data.id, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

