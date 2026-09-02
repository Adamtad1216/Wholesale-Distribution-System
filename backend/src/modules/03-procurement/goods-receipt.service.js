import prisma from '../../config/prisma.js';

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

      // 2. Update PO status to PARTIALLY_RECEIVED or RECEIVED depending on logic (omitted for brevity, assume manual or simple update for now)
      // Let's just mark it RECEIVED if we created a GR.
      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: 'RECEIVED' }
      });

      // 3. Trigger Developer B's Inventory Update
      // For each item received, update WarehouseStock and create StockMovement
      for (const item of receipt.items) {
        const qtyReceived = Number(item.receivedQuantity) - Number(item.damagedQuantity);
        if (qtyReceived <= 0) continue;

        // Upsert WarehouseStock
        const existingStock = await tx.warehouseStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: warehouseId,
              productId: item.productId
            }
          }
        });

        if (existingStock) {
          await tx.warehouseStock.update({
            where: { id: existingStock.id },
            data: {
              quantity: { increment: qtyReceived },
              availableQuantity: { increment: qtyReceived }
            }
          });
        } else {
          await tx.warehouseStock.create({
            data: {
              warehouseId: warehouseId,
              productId: item.productId,
              quantity: qtyReceived,
              availableQuantity: qtyReceived,
              createdById
            }
          });
        }

        // Create Stock Movement Log
        await tx.stockMovement.create({
          data: {
            warehouseId: warehouseId,
            productId: item.productId,
            movementType: 'PURCHASE_RECEIPT',
            quantity: qtyReceived,
            referenceType: 'GOODS_RECEIPT',
            referenceId: receipt.id,
            unitCost: item.unitCost,
            createdById
          }
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
