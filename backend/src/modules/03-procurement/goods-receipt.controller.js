import goodsReceiptService from './goods-receipt.service.js';

export const createGoodsReceipt = async (req, res, next) => {
  try {
    const createdById = req.user?.id;
    const receipt = await goodsReceiptService.createGoodsReceipt(req.body, createdById);
    res.status(201).json({ success: true, data: receipt, message: 'Goods Receipt created successfully in PENDING status' });
  } catch (error) {
    next(error);
  }
};

export const approveGoodsReceipt = async (req, res, next) => {
  try {
    const approvedById = req.user?.id;
    const receipt = await goodsReceiptService.approveGoodsReceipt(req.params.id, approvedById, req.body);
    res.status(200).json({ success: true, data: receipt, message: 'Goods Receipt approved, payment recorded, and inventory updated' });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const updatedById = req.user?.id;
    const { status } = req.body;
    const receipt = await goodsReceiptService.updateStatus(req.params.id, status, updatedById);
    res.status(200).json({ success: true, data: receipt, message: 'Goods Receipt status updated' });
  } catch (error) {
    next(error);
  }
};

export const getGoodsReceipts = async (req, res, next) => {
  try {
    const { skip, take, purchaseOrderId, warehouseId } = req.query;
    const filters = {};
    if (purchaseOrderId) filters.purchaseOrderId = purchaseOrderId;
    if (warehouseId) filters.warehouseId = warehouseId;

    const result = await goodsReceiptService.getGoodsReceipts(filters, { skip, take });
    res.status(200).json({
      success: true,
      data: result.receipts,
      meta: { total: result.total, skip: result.skip, take: result.take }
    });
  } catch (error) {
    next(error);
  }
};

export const getGoodsReceiptById = async (req, res, next) => {
  try {
    const receipt = await goodsReceiptService.getGoodsReceiptById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Goods Receipt not found' });
    res.status(200).json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};
