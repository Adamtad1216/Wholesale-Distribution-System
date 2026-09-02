import purchaseOrderService from './purchase-order.service.js';

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const createdById = req.user?.id;
    const po = await purchaseOrderService.createPurchaseOrder(req.body, createdById);
    res.status(201).json({ success: true, data: po, message: 'Purchase Order created successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseOrders = async (req, res, next) => {
  try {
    const { skip, take, status, supplierId } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (supplierId) filters.supplierId = supplierId;

    const result = await purchaseOrderService.getPurchaseOrders(filters, { skip, take });
    res.status(200).json({
      success: true,
      data: result.purchaseOrders,
      meta: { total: result.total, skip: result.skip, take: result.take }
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const po = await purchaseOrderService.getPurchaseOrderById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    res.status(200).json({ success: true, data: po });
  } catch (error) {
    next(error);
  }
};

export const approvePurchaseOrder = async (req, res, next) => {
  try {
    const approvedById = req.user?.id;
    const po = await purchaseOrderService.approvePurchaseOrder(req.params.id, approvedById);
    res.status(200).json({ success: true, data: po, message: 'Purchase Order approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const updatedById = req.user?.id;
    const po = await purchaseOrderService.updatePurchaseOrderStatus(req.params.id, req.body.status, updatedById);
    res.status(200).json({ success: true, data: po, message: 'Status updated successfully' });
  } catch (error) {
    next(error);
  }
};
