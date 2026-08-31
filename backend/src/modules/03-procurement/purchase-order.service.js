import prisma from '../../config/prisma.js';

class PurchaseOrderService {
  async createPurchaseOrder(data, createdById) {
    const { supplierId, warehouseId, expectedDate, items, subtotal, discount, tax, total } = data;
    const poNumber = data.poNumber || `PO-${Date.now()}`;
    const orderDate = new Date();

    return await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        warehouseId,
        orderedBy: createdById, // The user creating it is the orderer
        createdById,
        orderDate,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal: subtotal || 0,
        discount: discount || 0,
        tax: tax || 0,
        total: total || 0,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: item.tax || 0,
            total: item.total || (item.quantity * item.unitPrice),
            createdById
          }))
        }
      },
      include: {
        items: true,
        supplier: true,
        warehouse: true,
      }
    });
  }

  async getPurchaseOrders(filters = {}, options = {}) {
    const skip = options.skip ? parseInt(options.skip, 10) : 0;
    const take = options.take ? parseInt(options.take, 10) : 50;

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: filters,
        skip,
        take,
        include: {
          supplier: true,
          warehouse: true,
          orderer: { select: { id: true, username: true } },
          approver: { select: { id: true, username: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.purchaseOrder.count({ where: filters })
    ]);

    return { purchaseOrders, total, skip, take };
  }

  async getPurchaseOrderById(id) {
    return await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        supplier: true,
        warehouse: true,
        goodsReceipts: true,
        orderer: { select: { id: true, username: true } },
        approver: { select: { id: true, username: true } }
      }
    });
  }

  async approvePurchaseOrder(id, approvedById) {
    return await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: approvedById,
        updatedById: approvedById
      }
    });
  }

  async updatePurchaseOrderStatus(id, status, updatedById) {
    return await prisma.purchaseOrder.update({
      where: { id },
      data: { status, updatedById }
    });
  }
}

export default new PurchaseOrderService();
