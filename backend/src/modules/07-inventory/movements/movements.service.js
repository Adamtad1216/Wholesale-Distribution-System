import prisma from '../../../config/prisma.js';
import { logAudit } from '../../../middleware/audit.middleware.js';
import { AppError } from '../../../utils/errors.js';
import { getPaginationParams, buildPaginationMeta } from '../../../utils/pagination.js';

export async function createMovement(data, createdById, req) {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: data.warehouseId, isArchived: false },
  });
  if (!warehouse) throw new AppError('Warehouse not found', 404);

  const product = await prisma.product.findFirst({
    where: { id: data.productId, isArchived: false },
  });
  if (!product) throw new AppError('Product not found', 404);

  const isIncrease = ['PURCHASE_RECEIPT', 'SALES_RETURN', 'ADJUSTMENT_IN', 'TRANSFER_IN'].includes(data.movementType);
  const isDecrease = ['SALES_FULFILLMENT', 'PURCHASE_RETURN', 'ADJUSTMENT_OUT', 'TRANSFER_OUT'].includes(data.movementType);

  const result = await prisma.$transaction(async (tx) => {
    const movement = await tx.stockMovement.create({
      data: {
        warehouseId: data.warehouseId,
        productId: data.productId,
        movementType: data.movementType,
        quantity: data.quantity,
        unitCost: data.unitCost,
        notes: data.notes,
        createdById,
      },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    let stock = await tx.warehouseStock.findFirst({
      where: { warehouseId: data.warehouseId, productId: data.productId },
    });

    if (!stock && isIncrease) {
      stock = await tx.warehouseStock.create({
        data: {
          warehouseId: data.warehouseId,
          productId: data.productId,
          quantity: data.quantity,
          reservedQuantity: 0,
          availableQuantity: data.quantity,
          minimumStock: 0,
          reorderLevel: 0,
          createdById,
        },
      });
    } else if (stock) {
      const currentQty = Number(stock.quantity);
      const newQty = isIncrease ? currentQty + data.quantity : currentQty - data.quantity;

      if (newQty < 0) {
        throw new AppError('Insufficient stock', 400);
      }

      await tx.warehouseStock.update({
        where: { id: stock.id },
        data: {
          quantity: newQty,
          availableQuantity: newQty - Number(stock.reservedQuantity),
          updatedById: createdById,
          updatedAt: new Date(),
        },
      });
    } else {
      throw new AppError('No stock found for this product in warehouse', 404);
    }

    // Create notification for stock movement
    await tx.notification.create({
      data: {
        userId: createdById,
        title: 'Stock Movement Created',
        message: `${isIncrease ? 'Added' : 'Removed'} ${data.quantity} units of ${product.name} ${isIncrease ? 'to' : 'from'} ${warehouse.name}`,
        type: 'INVENTORY_MOVEMENT',
        createdById,
      },
    });

    return movement;
  });

  await logAudit({
    createdById,
    action: 'STOCK_MOVEMENT_CREATED',
    entityType: 'StockMovement',
    entityId: result.id,
    newValues: { movementType: data.movementType, quantity: data.quantity, warehouseId: data.warehouseId, productId: data.productId },
    req,
  });

  return result;
}

export async function getMovements(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = { isArchived: false };

  if (filters.warehouseId) where.warehouseId = filters.warehouseId;
  if (filters.productId) where.productId = filters.productId;
  if (filters.movementType) where.movementType = filters.movementType;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    movements,
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export async function deleteMovement(id, deletedById, req) {
  const existing = await prisma.stockMovement.findFirst({
    where: { id, isArchived: false },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      product: { select: { id: true, name: true, sku: true } },
    },
  });
  if (!existing) throw new AppError('Stock movement not found', 404);

  const movement = await prisma.$transaction(async (tx) => {
    const deletedMovement = await tx.stockMovement.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        updatedById: deletedById,
        updatedAt: new Date(),
      },
    });

    // Create notification
    await tx.notification.create({
      data: {
        userId: deletedById,
        title: 'Stock Movement Deleted',
        message: `Deleted stock movement for ${existing.product.name} in ${existing.warehouse.name}`,
        type: 'INVENTORY_MOVEMENT_DELETED',
        createdById: deletedById,
      },
    });

    return deletedMovement;
  });

  await logAudit({
    createdById: deletedById,
    action: 'STOCK_MOVEMENT_DELETED',
    entityType: 'StockMovement',
    entityId: id,
    oldValues: { isArchived: false },
    newValues: { isArchived: true },
    req,
  });

  return { id: movement.id, deleted: true };
}
