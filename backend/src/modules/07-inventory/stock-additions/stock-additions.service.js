import prisma from '../../../config/prisma.js';
import { logAudit } from '../../../middleware/audit.middleware.js';
import { AppError } from '../../../utils/errors.js';
import { getPaginationParams, buildPaginationMeta } from '../../../utils/pagination.js';
import { enforceWarehouseScope, getUserScope } from '../../../utils/warehouse-scope.js';

// ──────────────────────────────────────────────────────────────────────────────
// Helper: compute live quantity summary for a (warehouseId, productId) pair
// ──────────────────────────────────────────────────────────────────────────────
export async function getStockQuantitySummary(warehouseId, productId, tx = prisma) {
  // Total quantity = latest currentTotalAvailableQty from the most recent non-archived addition
  const latestAddition = await tx.productAddedQuantity.findFirst({
    where: { warehouseId, productId, isArchived: false },
    orderBy: [{ addedAt: 'desc' }, { createdAt: 'desc' }],
    select: { currentTotalAvailableQty: true },
  });

  const totalQuantity = latestAddition ? Number(latestAddition.currentTotalAvailableQty) : 0;

  // Reserved quantity = sum of active RESERVED stock reservations
  const reservedAgg = await tx.stockReservation.aggregate({
    where: { warehouseId, productId, status: 'RESERVED', isArchived: false },
    _sum: { quantity: true },
  });
  const reservedQuantity = Number(reservedAgg._sum.quantity) || 0;

  const availableQuantity = Math.max(0, totalQuantity - reservedQuantity);

  return { quantity: totalQuantity, reservedQuantity, availableQuantity };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: sanitize a ProductAddedQuantity record for API output
// ──────────────────────────────────────────────────────────────────────────────
const sanitizeAddition = (a) => {
  if (!a) return a;
  return {
    ...a,
    previousTotalQty: Number(a.previousTotalQty),
    addedQuantity: Number(a.addedQuantity),
    currentTotalAvailableQty: Number(a.currentTotalAvailableQty),
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// CREATE
// ──────────────────────────────────────────────────────────────────────────────
export async function createStockAddition(data, createdById, req, user = null) {
  await enforceWarehouseScope(user, data.warehouseId);

  const warehouse = await prisma.warehouse.findFirst({
    where: { id: data.warehouseId, isArchived: false },
  });
  if (!warehouse) throw new AppError('Warehouse not found', 404);

  const product = await prisma.product.findFirst({
    where: { id: data.productId, isArchived: false },
  });
  if (!product) throw new AppError('Product not found', 404);

  const result = await prisma.$transaction(async (tx) => {
    // Ensure a WarehouseStock record exists (or restore if archived)
    let stock = await tx.warehouseStock.findFirst({
      where: { warehouseId: data.warehouseId, productId: data.productId },
    });

    if (!stock) {
      stock = await tx.warehouseStock.create({
        data: {
          warehouseId: data.warehouseId,
          productId: data.productId,
          minimumStock: 0,
          reorderLevel: 0,
          createdById,
        },
      });
    } else if (stock.isArchived) {
      stock = await tx.warehouseStock.update({
        where: { id: stock.id },
        data: { isArchived: false, archivedAt: null, updatedById: createdById },
      });
    }

    // Compute running balance
    const { quantity: previousTotalQty } = await getStockQuantitySummary(
      data.warehouseId, data.productId, tx
    );
    const addedQty = Number(data.addedQuantity);
    const currentTotalAvailableQty = previousTotalQty + addedQty;

    const addition = await tx.productAddedQuantity.create({
      data: {
        warehouseStockId: stock.id,
        warehouseId: data.warehouseId,
        productId: data.productId,
        previousTotalQty,
        addedQuantity: addedQty,
        currentTotalAvailableQty,
        addedAt: data.addedAt || new Date(),
        referenceType: data.referenceType || 'MANUAL_INTAKE',
        referenceId: data.referenceId || null,
        notes: data.notes || null,
        createdById,
      },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: { select: { id: true, name: true, abbreviation: true } },
            images: { where: { isArchived: false }, select: { id: true, imageUrl: true, isPrimary: true } },
          },
        },
        warehouseStock: { select: { id: true, minimumStock: true, reorderLevel: true } },
        createdBy: { select: { id: true, username: true, person: { select: { firstName: true, lastName: true } } } },
      },
    });

    // Notification
    await tx.notification.create({
      data: {
        userId: createdById,
        title: 'Stock Quantity Added',
        message: `Added ${addedQty} units of ${product.name} to ${warehouse.name}. New total: ${currentTotalAvailableQty}.`,
        type: 'INVENTORY_STOCK_ADDITION_CREATED',
        createdById,
      },
    });

    return addition;
  });

  await logAudit({
    createdById,
    action: 'STOCK_ADDITION_CREATED',
    entityType: 'ProductAddedQuantity',
    entityId: result.id,
    newValues: {
      warehouseId: data.warehouseId,
      productId: data.productId,
      addedQuantity: data.addedQuantity,
      referenceType: data.referenceType,
    },
    req,
  });

  return sanitizeAddition(result);
}

// ──────────────────────────────────────────────────────────────────────────────
// LIST (paginated)
// ──────────────────────────────────────────────────────────────────────────────
export async function getStockAdditions(filters, user = null) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = { isArchived: false };

  if (user) {
    const scope = await getUserScope(user);
    if (!scope.isGlobal) {
      const allowedWarehouseIds = scope.warehouseIds || [];
      if (filters.warehouseId) {
        if (!allowedWarehouseIds.includes(filters.warehouseId)) {
          throw new AppError('You are not authorized to view stock additions for this warehouse', 403);
        }
        where.warehouseId = filters.warehouseId;
      } else {
        where.warehouseId = { in: allowedWarehouseIds };
      }
    } else if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }
  } else if (filters.warehouseId) {
    where.warehouseId = filters.warehouseId;
  }

  if (filters.productId) where.productId = filters.productId;
  if (filters.warehouseStockId) where.warehouseStockId = filters.warehouseStockId;
  if (filters.referenceType) where.referenceType = filters.referenceType;
  if (filters.startDate || filters.endDate) {
    where.addedAt = {};
    if (filters.startDate) where.addedAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.addedAt.lte = new Date(filters.endDate);
  }

  const include = {
    warehouse: { select: { id: true, name: true, code: true } },
    product: {
      select: {
        id: true,
        name: true,
        sku: true,
        unit: { select: { id: true, name: true, abbreviation: true } },
        images: { where: { isArchived: false }, select: { id: true, imageUrl: true, isPrimary: true } },
      },
    },
    warehouseStock: { select: { id: true, minimumStock: true, reorderLevel: true } },
    createdBy: { select: { id: true, username: true, person: { select: { firstName: true, lastName: true } } } },
    updatedBy: { select: { id: true, username: true, person: { select: { firstName: true, lastName: true } } } },
  };

  const [additions, total] = await Promise.all([
    prisma.productAddedQuantity.findMany({
      where,
      include,
      orderBy: [{ addedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.productAddedQuantity.count({ where }),
  ]);

  return {
    additions: additions.map(sanitizeAddition),
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// GET BY ID
// ──────────────────────────────────────────────────────────────────────────────
export async function getStockAdditionById(id, user = null) {
  const addition = await prisma.productAddedQuantity.findFirst({
    where: { id, isArchived: false },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          unit: { select: { id: true, name: true, abbreviation: true } },
          images: { where: { isArchived: false }, select: { id: true, imageUrl: true, isPrimary: true } },
        },
      },
      warehouseStock: { select: { id: true, minimumStock: true, reorderLevel: true } },
      createdBy: { select: { id: true, username: true, person: { select: { firstName: true, lastName: true } } } },
      updatedBy: { select: { id: true, username: true, person: { select: { firstName: true, lastName: true } } } },
    },
  });

  if (!addition) throw new AppError('Stock addition not found', 404);
  await enforceWarehouseScope(user, addition.warehouseId);
  return sanitizeAddition(addition);
}

// ──────────────────────────────────────────────────────────────────────────────
// UPDATE
// ──────────────────────────────────────────────────────────────────────────────
export async function updateStockAddition(id, data, updatedById, req, user = null) {
  const existing = await prisma.productAddedQuantity.findFirst({
    where: { id, isArchived: false },
  });
  if (!existing) throw new AppError('Stock addition not found', 404);
  await enforceWarehouseScope(user, existing.warehouseId);

  const updateData = {};
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.referenceType !== undefined) updateData.referenceType = data.referenceType;
  if (data.referenceId !== undefined) updateData.referenceId = data.referenceId;

  if (data.addedQuantity !== undefined) {
    const oldAdded = Number(existing.addedQuantity);
    const newAdded = Number(data.addedQuantity);
    const delta = newAdded - oldAdded;

    // Update this record's quantities
    updateData.addedQuantity = newAdded;
    updateData.currentTotalAvailableQty = Number(existing.previousTotalQty) + newAdded;

    if (delta !== 0) {
      // Cascade: update all subsequent addition records for the same (warehouse, product)
      const subsequent = await prisma.productAddedQuantity.findMany({
        where: {
          warehouseId: existing.warehouseId,
          productId: existing.productId,
          isArchived: false,
          addedAt: { gt: existing.addedAt },
        },
        orderBy: [{ addedAt: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, previousTotalQty: true, addedQuantity: true, currentTotalAvailableQty: true },
      });

      for (const s of subsequent) {
        await prisma.productAddedQuantity.update({
          where: { id: s.id },
          data: {
            previousTotalQty: Number(s.previousTotalQty) + delta,
            currentTotalAvailableQty: Number(s.currentTotalAvailableQty) + delta,
          },
        });
      }
    }
  }

  if (Object.keys(updateData).length === 0) return getStockAdditionById(id, user);

  updateData.updatedById = updatedById;
  updateData.updatedAt = new Date();

  const updated = await prisma.productAddedQuantity.update({
    where: { id },
    data: updateData,
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          unit: { select: { id: true, name: true, abbreviation: true } },
          images: { where: { isArchived: false }, select: { id: true, imageUrl: true, isPrimary: true } },
        },
      },
      warehouseStock: { select: { id: true, minimumStock: true, reorderLevel: true } },
      createdBy: { select: { id: true, username: true, person: { select: { firstName: true, lastName: true } } } },
      updatedBy: { select: { id: true, username: true, person: { select: { firstName: true, lastName: true } } } },
    },
  });

  await logAudit({
    createdById: updatedById,
    action: 'STOCK_ADDITION_UPDATED',
    entityType: 'ProductAddedQuantity',
    entityId: id,
    oldValues: { addedQuantity: existing.addedQuantity, notes: existing.notes },
    newValues: updateData,
    req,
  });

  return sanitizeAddition(updated);
}

// ──────────────────────────────────────────────────────────────────────────────
// DELETE (soft-delete)
// ──────────────────────────────────────────────────────────────────────────────
export async function deleteStockAddition(id, deletedById, req, user = null) {
  const existing = await prisma.productAddedQuantity.findFirst({
    where: { id, isArchived: false },
    include: {
      warehouse: { select: { id: true, name: true } },
      product: { select: { id: true, name: true } },
    },
  });
  if (!existing) throw new AppError('Stock addition not found', 404);
  await enforceWarehouseScope(user, existing.warehouseId);

  const removedQty = Number(existing.addedQuantity);

  // Rebalance all subsequent additions
  const subsequent = await prisma.productAddedQuantity.findMany({
    where: {
      warehouseId: existing.warehouseId,
      productId: existing.productId,
      isArchived: false,
      addedAt: { gt: existing.addedAt },
    },
    orderBy: [{ addedAt: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, previousTotalQty: true, addedQuantity: true, currentTotalAvailableQty: true },
  });

  await prisma.$transaction(async (tx) => {
    // Soft-delete the record
    await tx.productAddedQuantity.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        updatedById: deletedById,
        updatedAt: new Date(),
      },
    });

    // Rebalance subsequent records
    for (const s of (subsequent || [])) {
      await tx.productAddedQuantity.update({
        where: { id: s.id },
        data: {
          previousTotalQty: Math.max(0, Number(s.previousTotalQty) - removedQty),
          currentTotalAvailableQty: Math.max(0, Number(s.currentTotalAvailableQty) - removedQty),
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: deletedById,
        title: 'Stock Addition Archived',
        message: `Removed stock addition of ${removedQty} units of ${existing.product.name} from ${existing.warehouse.name}.`,
        type: 'INVENTORY_STOCK_ADDITION_DELETED',
        createdById: deletedById,
      },
    });
  });

  await logAudit({
    createdById: deletedById,
    action: 'STOCK_ADDITION_DELETED',
    entityType: 'ProductAddedQuantity',
    entityId: id,
    oldValues: {
      addedQuantity: existing.addedQuantity,
      warehouseId: existing.warehouseId,
      productId: existing.productId,
    },
    newValues: { isArchived: true },
    req,
  });

  return { id, deleted: true };
}
