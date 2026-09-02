import { sendSuccess, sendCreated, sendNoContent, sendError } from "../../../../utils/api-response.js";
import {
  createCustomerAddress,
  getCustomerAddresses,
  getCustomerAddressById,
  updateCustomerAddress,
  deleteCustomerAddress,
} from "./addresses.service.js";
import { customerAddressIdSchema } from "./addresses.validation.js";

export async function listCustomerAddresses(req, res, next) {
  try {
    const addresses = await getCustomerAddresses(req.params.customerId);
    sendSuccess(res, addresses);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerAddress(req, res, next) {
  try {
    const { addressId } = req.params;
    const idResult = customerAddressIdSchema.safeParse({ id: addressId });
    if (!idResult.success) {
      return sendError(res, 'Invalid address ID', 400);
    }
    const address = await getCustomerAddressById(req.params.customerId, idResult.data.id);
    sendSuccess(res, address);
  } catch (err) {
    next(err);
  }
}

export async function addCustomerAddress(req, res, next) {
  try {
    const address = await createCustomerAddress(req.params.customerId, req.body, req.user.id, req);
    sendCreated(res, address);
  } catch (err) {
    next(err);
  }
}

export async function modifyCustomerAddress(req, res, next) {
  try {
    const { addressId } = req.params;
    const idResult = customerAddressIdSchema.safeParse({ id: addressId });
    if (!idResult.success) {
      return sendError(res, 'Invalid address ID', 400);
    }
    const address = await updateCustomerAddress(req.params.customerId, idResult.data.id, req.body, req.user.id, req);
    sendSuccess(res, address);
  } catch (err) {
    next(err);
  }
}

export async function removeCustomerAddress(req, res, next) {
  try {
    const { addressId } = req.params;
    const idResult = customerAddressIdSchema.safeParse({ id: addressId });
    if (!idResult.success) {
      return sendError(res, 'Invalid address ID', 400);
    }
    await deleteCustomerAddress(req.params.customerId, idResult.data.id, req.user.id, req);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
