import prisma from '../../../config/prisma.js';
import { logAudit } from '../../../middleware/audit.middleware.js';
import { AppError } from '../../../utils/errors.js';
import { getPaginationParams, buildPaginationMeta } from '../../../utils/pagination.js';

export async function createAdjustment(data, createdById, req) {
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

  const adjustment = await prisma.stockAdjustment.create({
    data: {
      warehouseId: data.warehouseId,
      reason: data.reason,
      status: 'PENDING',
      createdById,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          systemQuantity: 0,
          actualQuantity: item.actualQuantity,
          difference: item.actualQuantity,
          reason: item.reason,
          createdById,
        })),
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

  await logAudit({
    createdById,
    action: 'ADJUSTMENT_CREATED',
    entityType: 'StockAdjustment',
    entityId: adjustment.id,
    newValues: { reason: data.reason, itemCount: data.items.length },
    req,
  });

  return adjustment;
}

export async function getAdjustments(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = { isArchived: false };

  if (filters.warehouseId) where.warehouseId = filters.warehouseId;
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

export async function getAdjustmentById(id) {
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
  return adjustment;
}

export async function approveAdjustment(id, data, createdById, req) {
  const existing = await prisma.stockAdjustment.findFirst({
    where: { id, isArchived: false },
    include: { items: true },
  });
  if (!existing) throw new AppError('Adjustment not found', 404);
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
          where: { warehouseId: existing.warehouseId, productId: item.productId },
        });

        const difference = Number(item.actualQuantity) - Number(item.systemQuantity);

        if (stock) {
          const newQty = Number(stock.quantity) + difference;
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

        await tx.stockMovement.create({
          data: {
            warehouseId: existing.warehouseId,
            productId: item.productId,
            movementType: difference >= 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
            quantity: Math.abs(difference),
            referenceType: 'STOCK_ADJUSTMENT',
            referenceId: adjustment.id,
            notes: `Adjustment ${adjustment.id}`,
            createdById,
          },
        });
      }
    }

    return adjustment;
  });

  await logAudit({
    createdById,
    action: 'ADJUSTMENT_APPROVED',
    entityType: 'StockAdjustment',
    entityId: id,
    newValues: { status: data.status },
    req,
  });

  return result;
}

export async function deleteAdjustment(id, deletedById, req) {
  const existing = await prisma.stockAdjustment.findFirst({
    where: { id, isArchived: false },
  });
  if (!existing) throw new AppError('Stock adjustment not found', 404);

  const adjustment = await prisma.stockAdjustment.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: deletedById,
      updatedAt: new Date(),
    },
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
