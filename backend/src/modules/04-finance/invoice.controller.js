import invoiceService from './invoice.service.js';
import prisma from '../../config/prisma.js';
import { hasPermission } from '../../middleware/permission.middleware.js';


function extractRoleNames(userOrRoles) {
  if (!userOrRoles) return [];
  if (typeof userOrRoles === 'string') return [userOrRoles.toUpperCase()];
  if (Array.isArray(userOrRoles)) {
    return userOrRoles
      .map((ur) => {
        if (typeof ur === 'string') return ur.toUpperCase();
        if (ur?.role?.name) return ur.role.name.toUpperCase();
        if (ur?.name) return ur.name.toUpperCase();
        return '';
      })
      .filter(Boolean);
  }
  if (typeof userOrRoles === 'object') {
    if (userOrRoles.userRoles) return extractRoleNames(userOrRoles.userRoles);
    if (userOrRoles.roles) return extractRoleNames(userOrRoles.roles);
    if (userOrRoles.role) return extractRoleNames(userOrRoles.role);
  }
  return [];
}

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
    if (req.query.customerId) filters.customerId = req.query.customerId;
    if (req.query.salesOrderId) filters.salesOrderId = req.query.salesOrderId;

    if (req.user) {
      const userRoles = extractRoleNames(req.user?.roles || req.user?.userRoles || req.user?.role);
      const isStaff = userRoles.some((r) =>
        ['ADMIN', 'SUPER_ADMIN', 'SALES_REPRESENTATIVE', 'SALES_REP', 'WAREHOUSE_MANAGER', 'ACCOUNTANT', 'FINANCE'].includes(r)
      );
      const canReadAllInvoices =
        isStaff ||
        hasPermission(req.user, 'invoices:read_all') ||
        hasPermission(req.user, 'sales_orders:read_all');

      if (!canReadAllInvoices) {
        // Customer scoping
        const customer = await prisma.customer.findFirst({
          where: {
            isArchived: false,
            OR: [
              { personId: req.user.personId },
              { organization: { contacts: { some: { personId: req.user.personId } } } },
              { createdById: req.user.id },
            ],
          },
          select: { id: true },
        });

        if (customer) {
          filters.customerId = customer.id;
        } else {
          // Check sales orders created by this user
          const userOrders = await prisma.salesOrder.findMany({
            where: { createdById: req.user.id },
            select: { id: true },
          });
          const orderIds = userOrders.map((o) => o.id);
          if (orderIds.length > 0) {
            filters.salesOrderId = { in: orderIds };
          } else {
            return res.status(200).json({ success: true, data: [] });
          }
        }
      }
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
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

