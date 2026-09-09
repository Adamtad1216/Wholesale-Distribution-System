import creditService from './credit.service.js';
import prisma from '../../../config/prisma.js';

export const createManualCredit = async (req, res, next) => {
  try {
    const createdById = req.user?.id;
    const credit = await creditService.createManualCredit(req.body, createdById);
    res.status(201).json({ success: true, data: credit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createCreditFromReturn = async (req, res, next) => {
  try {
    const createdById = req.user?.id;
    const credit = await creditService.createCreditFromReturn(req.body, createdById);
    res.status(201).json({ success: true, data: credit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCustomerCredits = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const permissions = req.user?.userRoles?.flatMap((ur) =>
      ur.role.rolePermissions?.map((rp) => rp.permission.name) || []
    ) || [];
    const roles = req.user?.userRoles?.map((ur) => ur.role.name) || [];
    const isSuperOrAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN') || permissions.includes('*');
    const hasReadAll = isSuperOrAdmin || permissions.includes('credits:read_all') || permissions.includes('credit:read_all');
    const hasRead = permissions.includes('credits:read') || permissions.includes('credit:read') || roles.includes('CUSTOMER');

    if (!hasReadAll && (hasRead || roles.includes('CUSTOMER'))) {
      const customer = await prisma.customer.findFirst({
        where: {
          isArchived: false,
          OR: [
            { personId: req.user?.personId },
            { organization: { contacts: { some: { personId: req.user?.personId } } } }
          ]
        },
        select: { id: true }
      });
      if (customer && customer.id !== customerId) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own credits' });
      }
    }

    const result = await creditService.getCustomerCredits(customerId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllCredits = async (req, res, next) => {
  try {
    const permissions = req.user?.userRoles?.flatMap((ur) =>
      ur.role.rolePermissions?.map((rp) => rp.permission.name) || []
    ) || [];
    const roles = req.user?.userRoles?.map((ur) => ur.role.name) || [];
    const isSuperOrAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN') || permissions.includes('*');
    const hasReadAll = isSuperOrAdmin || permissions.includes('credits:read_all') || permissions.includes('credit:read_all');
    const hasRead = permissions.includes('credits:read') || permissions.includes('credit:read') || roles.includes('CUSTOMER');

    const query = { ...req.query };

    if (hasReadAll && !roles.includes('CUSTOMER')) {
      if (req.query.customerId) query.customerId = req.query.customerId;
    } else if (hasRead || roles.includes('CUSTOMER')) {
      const customer = await prisma.customer.findFirst({
        where: {
          isArchived: false,
          OR: [
            { personId: req.user?.personId },
            { organization: { contacts: { some: { personId: req.user?.personId } } } }
          ]
        },
        select: { id: true }
      });
      if (customer) {
        query.customerId = customer.id;
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view credits'
      });
    }

    const credits = await creditService.getAllCredits(query);
    res.json({ success: true, data: credits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyCreditToInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { invoiceId, amount } = req.body;
    const updatedById = req.user?.id;

    const result = await creditService.applyCreditToInvoice(id, invoiceId, amount, updatedById);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCreditHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await creditService.getCreditHistory(id);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const getCustomerCreditSummary = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const permissions = req.user?.userRoles?.flatMap((ur) =>
      ur.role.rolePermissions?.map((rp) => rp.permission.name) || []
    ) || [];
    const roles = req.user?.userRoles?.map((ur) => ur.role.name) || [];
    const isSuperOrAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN') || permissions.includes('*');
    const hasReadAll = isSuperOrAdmin || permissions.includes('credits:read_all') || permissions.includes('credit:read_all');
    const hasRead = permissions.includes('credits:read') || permissions.includes('credit:read') || roles.includes('CUSTOMER');

    if (!hasReadAll && (hasRead || roles.includes('CUSTOMER'))) {
      const customer = await prisma.customer.findFirst({
        where: {
          isArchived: false,
          OR: [
            { personId: req.user?.personId },
            { organization: { contacts: { some: { personId: req.user?.personId } } } }
          ]
        },
        select: { id: true }
      });
      if (customer && customer.id !== customerId) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own credit summary' });
      }
    }

    const summary = await creditService.getCustomerCreditSummary(customerId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const validateCreditLimit = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { amount } = req.body;
    const result = await creditService.validateCreditLimit(customerId, Number(amount));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
