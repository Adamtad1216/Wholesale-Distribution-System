import invoiceService from './invoice.service.js';

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
