import { sendSuccess, sendPaginatedSuccess, sendCreated, sendNoContent, sendError } from "../../../utils/api-response.js";
import { employeeIdSchema } from './employees.validation.js';
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from './employees.service.js';

export async function listEmployees(req, res, next) {
  try {
    const filters = { ...req.query };
    const { employees, meta } = await getEmployees(filters);
    sendPaginatedSuccess(res, employees, meta);
  } catch (err) {
    next(err);
  }
}

export async function getEmployee(req, res, next) {
  try {
    const idResult = employeeIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid employee ID', 400);
    }
    const employee = await getEmployeeById(idResult.data.id);
    sendSuccess(res, employee);
  } catch (err) {
    next(err);
  }
}

export async function addEmployee(req, res, next) {
  try {
    const employee = await createEmployee(req.body, req.user.id, req);
    sendCreated(res, employee);
  } catch (err) {
    next(err);
  }
}

export async function modifyEmployee(req, res, next) {
  try {
    const idResult = employeeIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid employee ID', 400);
    }
    const employee = await updateEmployee(idResult.data.id, req.body, req.user.id, req);
    sendSuccess(res, employee);
  } catch (err) {
    next(err);
  }
}

export async function removeEmployee(req, res, next) {
  try {
    const idResult = employeeIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) {
      return sendError(res, 'Invalid employee ID', 400);
    }
    await deleteEmployee(idResult.data.id, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

