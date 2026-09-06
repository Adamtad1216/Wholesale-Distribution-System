import invoiceService from './invoice.service.js';
import prisma from '../../../config/prisma.js';

/**
 * Generate invoice upfront before delivery (Pre-payment flow)
 */
export const createFromOrder = async (req, res, next) => {
  try {
    const { salesOrderId } = req.body;
    const createdById = req.user?.id; // Assuming user auth middleware

    if (!salesOrderId) {
      return res.status(400).json({ success: false, message: 'salesOrderId is required' });
    }

    const invoice = await invoiceService.createInvoiceFromOrder(salesOrderId, createdById);
    res.status(201).json({ 
      success: true, 
      data: invoice, 
      message: 'Upfront invoice created successfully from sales order' 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate invoice based on exact delivered quantities (Post-delivery flow)
 */
export const createFromDelivery = async (req, res, next) => {
  try {
    const { deliveryId } = req.body;
    const createdById = req.user?.id;

    if (!deliveryId) {
      return res.status(400).json({ success: false, message: 'deliveryId is required' });
    }

    const invoice = await invoiceService.createInvoiceFromDelivery(deliveryId, createdById);
    res.status(201).json({ 
      success: true, 
      data: invoice, 
      message: 'Invoice created successfully based on delivery fulfillment' 
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.salesOrderId) filters.salesOrderId = req.query.salesOrderId;

    // Check user permissions and roles
    const permissions = req.user?.userRoles?.flatMap((ur) =>
      ur.role.rolePermissions?.map((rp) => rp.permission.name) || []
    ) || [];
    const roles = req.user?.userRoles?.map((ur) => ur.role.name) || [];
    const isSuperOrAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN') || permissions.includes('*');

    const hasViewAll = isSuperOrAdmin || permissions.includes('invoice:view_all');
    const hasViewOwn = permissions.includes('invoice:view_own') || roles.includes('CUSTOMER');

    if (hasViewAll && !roles.includes('CUSTOMER')) {
      // Allowed to view all invoices across the system
      if (req.query.customerId) filters.customerId = req.query.customerId;
    } else if (hasViewOwn || roles.includes('CUSTOMER')) {
      // Scoped strictly to own invoices
      // 1. Check if user is a customer or customer contact
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
        filters.customerId = customer.id;
      } else {
        // 2. User is staff / sales rep: filter by created invoices or assigned sales orders
        const employee = await prisma.employee.findFirst({
          where: { personId: req.user?.personId },
          select: { id: true }
        });

        const ownConditions = [{ createdById: req.user?.id }];
        if (employee) {
          ownConditions.push({ salesOrder: { salesRepId: employee.id } });
        }

        filters.OR = ownConditions;
      }
    } else if (permissions.includes('invoices:read')) {
      // Legacy invoices:read fallback
      if (req.query.customerId) filters.customerId = req.query.customerId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view invoices'
      });
    }

    const invoices = await invoiceService.getInvoices(filters);
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Security Check: Enforce permission scoping
    const permissions = req.user?.userRoles?.flatMap((ur) =>
      ur.role.rolePermissions?.map((rp) => rp.permission.name) || []
    ) || [];
    const roles = req.user?.userRoles?.map((ur) => ur.role.name) || [];
    const isSuperOrAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN') || permissions.includes('*');

    const hasViewAll = isSuperOrAdmin || permissions.includes('invoice:view_all');
    const hasViewOwn = permissions.includes('invoice:view_own') || roles.includes('CUSTOMER');

    if (!hasViewAll && (hasViewOwn || roles.includes('CUSTOMER'))) {
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

      const employee = await prisma.employee.findFirst({
        where: { personId: req.user?.personId },
        select: { id: true }
      });

      const isCustomerOwner = customer && invoice.customerId === customer.id;
      const isCreator = invoice.createdById === req.user?.id;
      const isSalesRep = employee && invoice.salesOrder?.salesRepId === employee.id;

      if (!isCustomerOwner && !isCreator && !isSalesRep) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view your own invoices'
        });
      }
    } else if (!hasViewAll && !permissions.includes('invoices:read')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this invoice'
      });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};
