import goodsReceiptService from './goods-receipt.service.js';

export const createGoodsReceipt = async (req, res, next) => {
  try {
    const createdById = req.user?.id;
    const receipt = await goodsReceiptService.createGoodsReceipt(req.body, createdById);
    res.status(201).json({ success: true, data: receipt, message: 'Goods Receipt created successfully and stock updated' });
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
