import prisma from '../../config/prisma.js';
import { getStockQuantitySummary } from '../07-inventory/stock-additions/stock-additions.service.js';

class GoodsReceiptService {
  async createGoodsReceipt(data, createdById) {
    const { purchaseOrderId, warehouseId, items } = data;
    const receiptNumber = data.receiptNumber || `GR-${Date.now()}`;
    const receivedAt = new Date();

    // Begin a transaction because we need to update stock
    return await prisma.$transaction(async (tx) => {
      // 1. Create Goods Receipt
      const receipt = await tx.goodsReceipt.create({
        data: {
          receiptNumber,
          purchaseOrderId,
          warehouseId,
          receivedBy: createdById, // Assuming current user is receiving
          createdById,
          receivedAt,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              orderedQuantity: item.orderedQuantity,
              receivedQuantity: item.receivedQuantity,
              damagedQuantity: item.damagedQuantity || 0,
              unitCost: item.unitCost || 0,
              createdById
            }))
          }
        },
        include: { items: true }
      });

      // 2. Update PO status to PARTIALLY_RECEIVED or RECEIVED
      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: 'RECEIVED' }
      });

      // 3. Record stock additions and create StockMovement for each received item
      for (const item of receipt.items) {
        const qtyReceived = Number(item.receivedQuantity) - Number(item.damagedQuantity);
        if (qtyReceived <= 0) continue;

        // Ensure WarehouseStock record exists (upsert pattern)
        let existingStock = await tx.warehouseStock.findFirst({
          where: { warehouseId, productId: item.productId },
        });

        if (!existingStock) {
          existingStock = await tx.warehouseStock.create({
            data: {
              warehouseId,
              productId: item.productId,
              minimumStock: 0,
              reorderLevel: 0,
              createdById,
            },
          });
        } else if (existingStock.isArchived) {
          existingStock = await tx.warehouseStock.update({
            where: { id: existingStock.id },
            data: { isArchived: false, archivedAt: null, updatedById: createdById },
          });
        }

        // Record the incoming quantity as a ProductAddedQuantity
        const { quantity: prevQty } = await getStockQuantitySummary(warehouseId, item.productId, tx);
        await tx.productAddedQuantity.create({
          data: {
            warehouseStockId: existingStock.id,
            warehouseId,
            productId: item.productId,
            previousTotalQty: prevQty,
            addedQuantity: qtyReceived,
            currentTotalAvailableQty: prevQty + qtyReceived,
            referenceType: 'GOODS_RECEIPT',
            referenceId: receipt.id,
            notes: `Received via goods receipt ${receiptNumber}`,
            createdById,
          },
        });

        // Create Stock Movement Log
        await tx.stockMovement.create({
          data: {
            warehouseId,
            productId: item.productId,
            movementType: 'PURCHASE_RECEIPT',
            quantity: qtyReceived,
            referenceType: 'GOODS_RECEIPT',
            referenceId: receipt.id,
            unitCost: item.unitCost,
            createdById,
          },
        });
      }

      return receipt;
    });
  }

  async getGoodsReceipts(filters = {}, options = {}) {
    const skip = options.skip ? parseInt(options.skip, 10) : 0;
    const take = options.take ? parseInt(options.take, 10) : 50;

    const [receipts, total] = await Promise.all([
      prisma.goodsReceipt.findMany({
        where: filters,
        skip,
        take,
        include: {
          purchaseOrder: true,
          warehouse: true,
          receiver: { select: { id: true, username: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.goodsReceipt.count({ where: filters })
    ]);

    return { receipts, total, skip, take };
  }

  async getGoodsReceiptById(id) {
    return await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        purchaseOrder: { include: { supplier: true } },
        warehouse: true,
        receiver: { select: { id: true, username: true } }
      }
    });
  }
}

export default new GoodsReceiptService();
