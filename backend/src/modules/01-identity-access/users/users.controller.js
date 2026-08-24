import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent } from "../../../utils/api-response.js";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
} from './users.service.js';

export async function listUsers(req, res, next) {
  try {
    const filters = { ...req.query };
    const { users, meta } = await getUsers(filters, req.user.id);
    sendPaginatedSuccess(res, users, meta);
  } catch (err) {
    next(err);
  }
}

export async function getUser(req, res, next) {
  try {
    const user = await getUserById(req.params.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function addUser(req, res, next) {
  try {
    const user = await createUser(req.body, req.user.id, req);
    sendCreated(res, user);
  } catch (err) {
    next(err);
  }
}

export async function modifyUser(req, res, next) {
  try {
    const user = await updateUser(req.params.id, req.body, req.user.id, req);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    await resetUserPassword(req.params.id, req.body.password, req.user.id, req);
    sendSuccess(res, { message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}

export async function removeUser(req, res, next) {
  try {
    await deleteUser(req.params.id, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

