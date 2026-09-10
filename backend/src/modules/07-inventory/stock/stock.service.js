import prisma from '../../../config/prisma.js';
import { logAudit } from '../../../middleware/audit.middleware.js';
import { AppError } from '../../../utils/errors.js';
import { getPaginationParams, buildPaginationMeta } from '../../../utils/pagination.js';
import { getUserScope, getAssignedWarehouseId, enforceWarehouseScope } from '../../../utils/warehouse-scope.js';

const sanitizeStock = (stock) => {
  if (!stock) return stock;
  return {
    ...stock,
    quantity: Number(stock.quantity),
    reservedQuantity: Number(stock.reservedQuantity),
    availableQuantity: Number(stock.availableQuantity),
    minimumStock: Number(stock.minimumStock),
    reorderLevel: Number(stock.reorderLevel),
  };
};

export async function createStock(data, createdById, req, user = null) {
  await enforceWarehouseScope(user, data.warehouseId);

  const warehouse = await prisma.warehouse.findFirst({
    where: { id: data.warehouseId, isArchived: false },
  });
  if (!warehouse) throw new AppError('Warehouse not found', 404);

  const product = await prisma.product.findFirst({
    where: { id: data.productId, isArchived: false },
  });
  if (!product) throw new AppError('Product not found', 404);

  // Check for any existing record — active OR previously archived
  const existingAny = await prisma.warehouseStock.findFirst({
    where: { warehouseId: data.warehouseId, productId: data.productId },
  });

  // Case 1: Active record already exists → conflict
  if (existingAny && !existingAny.isArchived) {
    throw new AppError(
      `An active stock record for "${product.name}" already exists in "${warehouse.name}". ` +
      `Use the Edit action to update the existing record instead.`,
      409
    );
  }

  const stock = await prisma.$transaction(async (tx) => {
    let newStock;

    if (existingAny && existingAny.isArchived) {
      // Case 2: Soft-deleted (archived) record found → restore it with fresh values
      newStock = await tx.warehouseStock.update({
        where: { id: existingAny.id },
        data: {
          quantity: data.quantity,
          reservedQuantity: 0,
          availableQuantity: data.quantity,
          minimumStock: data.minimumStock ?? existingAny.minimumStock,
          reorderLevel: data.reorderLevel ?? existingAny.reorderLevel,
          isArchived: false,
          archivedAt: null,
          updatedById: createdById,
          updatedAt: new Date(),
        },
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          product: { select: { id: true, name: true, sku: true } },
        },
      });
    } else {
      // Case 3: No record at all → create fresh
      newStock = await tx.warehouseStock.create({
        data: {
          warehouseId: data.warehouseId,
          productId: data.productId,
          quantity: data.quantity,
          reservedQuantity: 0,
          availableQuantity: data.quantity,
          minimumStock: data.minimumStock,
          reorderLevel: data.reorderLevel,
          createdById,
        },
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          product: { select: { id: true, name: true, sku: true } },
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: createdById,
        title: existingAny ? 'Stock Record Restored' : 'Stock Created',
        message: existingAny
          ? `Restored and updated stock for ${product.name} in ${warehouse.name} to ${data.quantity} units.`
          : `Added ${data.quantity} units of ${product.name} to ${warehouse.name}.`,
        type: 'INVENTORY_STOCK_CREATED',
        createdById,
      },
    });

    return newStock;
  });

  await logAudit({
    createdById,
    action: existingAny ? 'STOCK_RESTORED' : 'STOCK_CREATED',
    entityType: 'WarehouseStock',
    entityId: stock.id,
    newValues: {
      warehouseId: data.warehouseId,
      productId: data.productId,
      quantity: data.quantity,
      restored: Boolean(existingAny),
    },
    req,
  });

  return sanitizeStock(stock);
}


export async function getStocks(filters, user = null) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = { isArchived: false };

  if (user) {
    const scope = await getUserScope(user);
    if (!scope.isGlobal) {
      const allowedWarehouseIds = scope.warehouseIds || [];
      if (filters.warehouseId) {
        if (!allowedWarehouseIds.includes(filters.warehouseId)) {
          throw new AppError('You are not authorized to view stock for this warehouse', 403);
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
  if (filters.lowStock) {
    where.reorderLevel = { gt: 0 };
    where.availableQuantity = { lte: prisma.warehouseStock.fields.reorderLevel };
  }

  const [stocks, total] = await Promise.all([
    prisma.warehouseStock.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true, unit: { select: { id: true, name: true, abbreviation: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.warehouseStock.count({ where }),
  ]);

  return {
    stocks: stocks.map(sanitizeStock),
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export async function getStockById(id, user = null) {
  const stock = await prisma.warehouseStock.findFirst({
    where: { id, isArchived: false },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      product: { select: { id: true, name: true, sku: true, unit: { select: { id: true, name: true, abbreviation: true } } } },
    },
  });

  if (!stock) throw new AppError('Stock not found', 404);
  await enforceWarehouseScope(user, stock.warehouseId);
  return sanitizeStock(stock);
}

export async function updateStock(id, data, createdById, req, user = null) {
  const existing = await prisma.warehouseStock.findFirst({
    where: { id, isArchived: false },
  });
  if (!existing) throw new AppError('Stock not found', 404);
  await enforceWarehouseScope(user, existing.warehouseId);

  const updateData = {};
  if (data.quantity !== undefined && data.quantity !== Number(existing.quantity)) {
    updateData.quantity = data.quantity;
    updateData.availableQuantity = data.quantity - Number(existing.reservedQuantity);
  }
  if (data.minimumStock !== undefined && data.minimumStock !== Number(existing.minimumStock)) {
    updateData.minimumStock = data.minimumStock;
  }
  if (data.reorderLevel !== undefined && data.reorderLevel !== Number(existing.reorderLevel)) {
    updateData.reorderLevel = data.reorderLevel;
  }

  if (Object.keys(updateData).length === 0) {
    return getStockById(id);
  }

  updateData.updatedById = createdById;
  updateData.updatedAt = new Date();

  const stock = await prisma.$transaction(async (tx) => {
    const updatedStock = await tx.warehouseStock.update({
      where: { id },
      data: updateData,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    // Create notification
    await tx.notification.create({
      data: {
        userId: createdById,
        title: 'Stock Updated',
        message: `Updated stock for ${updatedStock.product.name} in ${updatedStock.warehouse.name}`,
        type: 'INVENTORY_STOCK_UPDATED',
        createdById,
      },
    });

    return updatedStock;
  });

  await logAudit({
    createdById,
    action: 'STOCK_UPDATED',
    entityType: 'WarehouseStock',
    entityId: id,
    oldValues: { quantity: existing.quantity, minimumStock: existing.minimumStock, reorderLevel: existing.reorderLevel },
    newValues: updateData,
    req,
  });

  return sanitizeStock(stock);
}

export async function deleteStock(id, deletedById, req, user = null) {
  const existing = await prisma.warehouseStock.findFirst({
    where: { id, isArchived: false },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      product: { select: { id: true, name: true, sku: true } },
    },
  });
  if (!existing) throw new AppError('Stock not found', 404);
  await enforceWarehouseScope(user, existing.warehouseId);

  const stock = await prisma.$transaction(async (tx) => {
    const deletedStock = await tx.warehouseStock.update({
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
        title: 'Stock Deleted',
        message: `Deleted stock for ${existing.product.name} from ${existing.warehouse.name}`,
        type: 'INVENTORY_STOCK_DELETED',
        createdById: deletedById,
      },
    });

    return deletedStock;
  });

  await logAudit({
    createdById: deletedById,
    action: 'STOCK_DELETED',
    entityType: 'WarehouseStock',
    entityId: id,
    oldValues: { isArchived: false },
    newValues: { isArchived: true },
    req,
  });

  return { id: stock.id, deleted: true };
}
