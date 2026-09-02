import prisma from '../../../config/prisma.js';
import { logAudit } from '../../../middleware/audit.middleware.js';
import { AppError } from '../../../utils/errors.js';
import { getPaginationParams, buildPaginationMeta } from '../../../utils/pagination.js';
import { getAssignedWarehouseId, enforceWarehouseScope } from '../../../utils/warehouse-scope.js';

export async function createAdjustment(data, createdById, req, user = null) {
  await enforceWarehouseScope(user, data.warehouseId);
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: data.warehouseId, isArchived: false },
  });
  if (!warehouse) throw new AppError('Warehouse not found', 404);

  for (const item of data.items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, isArchived: false },
    });
    if (!product) throw new AppError(`Product not found: ${item.productId}`, 404);
  }

  const itemsWithSystemStock = await Promise.all(
    data.items.map(async (item) => {
      const stock = await prisma.warehouseStock.findFirst({
        where: { warehouseId: data.warehouseId, productId: item.productId, isArchived: false },
      });
      const systemQuantity = stock ? Number(stock.quantity) : 0;
      const actualQuantity = Number(item.actualQuantity);
      const difference = actualQuantity - systemQuantity;
      return {
        productId: item.productId,
        systemQuantity,
        actualQuantity,
        difference,
        reason: item.reason,
        createdById,
      };
    })
  );

  const adjustment = await prisma.$transaction(async (tx) => {
    const newAdjustment = await tx.stockAdjustment.create({
      data: {
        warehouseId: data.warehouseId,
        reason: data.reason,
        status: 'PENDING',
        createdById,
        items: {
          create: itemsWithSystemStock,
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    // Create notification
    await tx.notification.create({
      data: {
        userId: createdById,
        title: 'Stock Adjustment Created',
        message: `Created stock adjustment for ${warehouse.name} with ${data.items.length} item(s)`,
        type: 'INVENTORY_ADJUSTMENT_CREATED',
        createdById,
      },
    });

    return newAdjustment;
  });

  await logAudit({
    createdById,
    action: 'ADJUSTMENT_CREATED',
    entityType: 'StockAdjustment',
    entityId: adjustment.id,
    newValues: { reason: data.reason, itemCount: data.items.length, warehouseId: data.warehouseId },
    req,
  });

  return adjustment;
}

export async function getAdjustments(filters, user = null) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = { isArchived: false };

  const assignedWarehouseId = await getAssignedWarehouseId(user);
  if (assignedWarehouseId) {
    if (filters.warehouseId && filters.warehouseId !== assignedWarehouseId) {
      throw new AppError('You are not authorized to view adjustments for this warehouse', 403);
    }
    where.warehouseId = assignedWarehouseId;
  } else if (filters.warehouseId) {
    where.warehouseId = filters.warehouseId;
  }

  if (filters.status) where.status = filters.status;

  const [adjustments, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        approver: { select: { id: true, person: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.stockAdjustment.count({ where }),
  ]);

  return {
    adjustments,
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export async function getAdjustmentById(id, user = null) {
  const adjustment = await prisma.stockAdjustment.findFirst({
    where: { id, isArchived: false },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      },
      warehouse: { select: { id: true, name: true, code: true } },
      approver: { select: { id: true, person: { select: { firstName: true, lastName: true } } } },
    },
  });

  if (!adjustment) throw new AppError('Adjustment not found', 404);
  await enforceWarehouseScope(user, adjustment.warehouseId);
  return adjustment;
}

export async function approveAdjustment(id, data, createdById, req, user = null) {
  const existing = await prisma.stockAdjustment.findFirst({
    where: { id, isArchived: false },
    include: { items: true, warehouse: true },
  });
  if (!existing) throw new AppError('Adjustment not found', 404);
  await enforceWarehouseScope(user, existing.warehouseId);
  if (existing.status !== 'PENDING') throw new AppError('Adjustment already processed', 400);

  const result = await prisma.$transaction(async (tx) => {
    const adjustment = await tx.stockAdjustment.update({
      where: { id },
      data: {
        status: data.status,
        approvedBy: createdById,
        approvedAt: new Date(),
        updatedById: createdById,
        updatedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    if (data.status === 'APPROVED') {
      for (const item of adjustment.items) {
        let stock = await tx.warehouseStock.findFirst({
          where: { warehouseId: existing.warehouseId, productId: item.productId, isArchived: false },
        });

        const difference = Number(item.difference);

        if (stock) {
          const newQty = Number(stock.quantity) + difference;
          if (newQty < 0) {
            throw new AppError(
              `Stock adjustment would cause negative inventory for product in warehouse. Current: ${stock.quantity}, Difference: ${difference}`,
              400
            );
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
        } else if (difference > 0) {
          await tx.warehouseStock.create({
            data: {
              warehouseId: existing.warehouseId,
              productId: item.productId,
              quantity: difference,
              reservedQuantity: 0,
              availableQuantity: difference,
              minimumStock: 0,
              reorderLevel: 0,
              createdById,
            },
          });
        }
      }
    }

    // Create notification
    await tx.notification.create({
      data: {
        userId: createdById,
        title: 'Stock Adjustment Processed',
        message: `Adjustment for ${existing.warehouse.name} has been ${data.status.toLowerCase()}`,
        type: 'INVENTORY_ADJUSTMENT_PROCESSED',
        createdById,
      },
    });

    return adjustment;
  });

  await logAudit({
    createdById,
    action: 'ADJUSTMENT_APPROVED',
    entityType: 'StockAdjustment',
    entityId: id,
    oldValues: { status: 'PENDING' },
    newValues: { status: data.status, approvedBy: createdById },
    req,
  });

  return result;
}

export async function deleteAdjustment(id, deletedById, req, user = null) {
  const existing = await prisma.stockAdjustment.findFirst({
    where: { id, isArchived: false },
    include: { warehouse: true },
  });
  if (!existing) throw new AppError('Adjustment not found', 404);
  await enforceWarehouseScope(user, existing.warehouseId);

  const adjustment = await prisma.$transaction(async (tx) => {
    const deletedAdjustment = await tx.stockAdjustment.update({
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
        title: 'Stock Adjustment Deleted',
        message: `Deleted stock adjustment for ${existing.warehouse.name}`,
        type: 'INVENTORY_ADJUSTMENT_DELETED',
        createdById: deletedById,
      },
    });

    return deletedAdjustment;
  });

  await logAudit({
    createdById: deletedById,
    action: 'ADJUSTMENT_DELETED',
    entityType: 'StockAdjustment',
    entityId: id,
    oldValues: { isArchived: false },
    newValues: { isArchived: true },
    req,
  });

  return { id: adjustment.id, deleted: true };
}

export async function updateAdjustment(id, data, updatedById, req, user = null) {
  const existing = await prisma.stockAdjustment.findFirst({
    where: { id, isArchived: false },
    include: { items: true, warehouse: true },
  });
  if (!existing) throw new AppError('Adjustment not found', 404);
  await enforceWarehouseScope(user, existing.warehouseId);
  if (existing.status !== 'PENDING') {
    throw new AppError('Only PENDING adjustments can be updated', 400);
  }

  if (data.items) {
    for (const item of data.items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, isArchived: false },
      });
      if (!product) throw new AppError(`Product not found: ${item.productId}`, 404);
    }
  }

  const adjustment = await prisma.$transaction(async (tx) => {
    await tx.stockAdjustment.update({
      where: { id },
      data: {
        reason: data.reason ?? existing.reason,
        updatedById,
        updatedAt: new Date(),
      },
    });

    if (data.items) {
      const itemsWithSystemStock = await Promise.all(
        data.items.map(async (item) => {
          const stock = await tx.warehouseStock.findFirst({
            where: { warehouseId: existing.warehouseId, productId: item.productId, isArchived: false },
          });
          const systemQuantity = stock ? Number(stock.quantity) : 0;
          const actualQuantity = Number(item.actualQuantity);
          const difference = actualQuantity - systemQuantity;
          return {
            adjustmentId: id,
            productId: item.productId,
            systemQuantity,
            actualQuantity,
            difference,
            reason: item.reason,
            createdById: updatedById,
          };
        })
      );
      await tx.stockAdjustmentItem.deleteMany({ where: { adjustmentId: id } });
      await tx.stockAdjustmentItem.createMany({
        data: itemsWithSystemStock,
      });
    }

    return tx.stockAdjustment.findFirst({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });
  });

  await logAudit({
    createdById: updatedById,
    action: 'ADJUSTMENT_UPDATED',
    entityType: 'StockAdjustment',
    entityId: id,
    oldValues: { reason: existing.reason, itemCount: existing.items.length },
    newValues: { reason: adjustment.reason, itemCount: adjustment.items.length },
    req,
  });

  return adjustment;
}

export async function getAdjustmentItem(adjustmentId, itemId, user = null) {
  const item = await prisma.stockAdjustmentItem.findFirst({
    where: { id: itemId, adjustmentId, isArchived: false },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      adjustment: { select: { id: true, status: true, warehouseId: true } },
    },
  });
  if (!item) throw new AppError('Adjustment item not found', 404);
  await enforceWarehouseScope(user, item.adjustment.warehouseId);
  return item;
}

export async function addAdjustmentItem(adjustmentId, data, createdById, req, user = null) {
  const adjustment = await prisma.stockAdjustment.findFirst({
    where: { id: adjustmentId, isArchived: false },
  });
  if (!adjustment) throw new AppError('Adjustment not found', 404);
  await enforceWarehouseScope(user, adjustment.warehouseId);
  if (adjustment.status !== 'PENDING') {
    throw new AppError('Items can only be added to PENDING adjustments', 400);
  }

  const product = await prisma.product.findFirst({
    where: { id: data.productId, isArchived: false },
  });
  if (!product) throw new AppError(`Product not found: ${data.productId}`, 404);

  const existingItem = await prisma.stockAdjustmentItem.findFirst({
    where: { adjustmentId, productId: data.productId, isArchived: false },
  });
  if (existingItem) {
    throw new AppError('Product already exists in this adjustment', 400);
  }

  const currentStock = await prisma.warehouseStock.findFirst({
    where: { warehouseId: adjustment.warehouseId, productId: data.productId, isArchived: false },
  });
  const systemQuantity = currentStock ? Number(currentStock.quantity) : 0;
  const actualQuantity = Number(data.actualQuantity);
  const difference = actualQuantity - systemQuantity;

  const item = await prisma.stockAdjustmentItem.create({
    data: {
      adjustmentId,
      productId: data.productId,
      systemQuantity,
      actualQuantity,
      difference,
      reason: data.reason,
      createdById,
    },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      adjustment: { select: { id: true, status: true, warehouseId: true } },
    },
  });

  await logAudit({
    createdById,
    action: 'ADJUSTMENT_ITEM_ADDED',
    entityType: 'StockAdjustmentItem',
    entityId: item.id,
    newValues: { adjustmentId, productId: data.productId, actualQuantity: data.actualQuantity },
    req,
  });

  return item;
}

export async function updateAdjustmentItem(adjustmentId, itemId, data, updatedById, req, user = null) {
  const existing = await prisma.stockAdjustmentItem.findFirst({
    where: { id: itemId, adjustmentId, isArchived: false },
    include: { adjustment: true },
  });
  if (!existing) throw new AppError('Adjustment item not found', 404);
  await enforceWarehouseScope(user, existing.adjustment.warehouseId);
  if (existing.adjustment.status !== 'PENDING') {
    throw new AppError('Items can only be updated in PENDING adjustments', 400);
  }

  const systemQuantity = Number(existing.systemQuantity);
  const actualQuantity = data.actualQuantity !== undefined ? Number(data.actualQuantity) : Number(existing.actualQuantity);
  const difference = actualQuantity - systemQuantity;

  const item = await prisma.stockAdjustmentItem.update({
    where: { id: itemId },
    data: {
      actualQuantity,
      difference,
      reason: data.reason ?? existing.reason,
      updatedById,
      updatedAt: new Date(),
    },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      adjustment: { select: { id: true, status: true, warehouseId: true } },
    },
  });

  await logAudit({
    createdById: updatedById,
    action: 'ADJUSTMENT_ITEM_UPDATED',
    entityType: 'StockAdjustmentItem',
    entityId: itemId,
    oldValues: { actualQuantity: existing.actualQuantity },
    newValues: { actualQuantity: item.actualQuantity },
    req,
  });

  return item;
}

export async function removeAdjustmentItem(adjustmentId, itemId, deletedById, req, user = null) {
  const existing = await prisma.stockAdjustmentItem.findFirst({
    where: { id: itemId, adjustmentId, isArchived: false },
    include: { adjustment: true, product: { select: { id: true, name: true } } },
  });
  if (!existing) throw new AppError('Adjustment item not found', 404);
  await enforceWarehouseScope(user, existing.adjustment.warehouseId);
  if (existing.adjustment.status !== 'PENDING') {
    throw new AppError('Items can only be removed from PENDING adjustments', 400);
  }

  await prisma.stockAdjustmentItem.update({
    where: { id: itemId },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: deletedById,
      updatedAt: new Date(),
    },
  });

  await logAudit({
    createdById: deletedById,
    action: 'ADJUSTMENT_ITEM_REMOVED',
    entityType: 'StockAdjustmentItem',
    entityId: itemId,
    oldValues: { productId: existing.productId, actualQuantity: existing.actualQuantity },
    req,
  });

  return { id: itemId, deleted: true };
}
