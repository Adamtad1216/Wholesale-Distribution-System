import prisma from '../../../config/prisma.js';
import { logAudit } from '../../../middleware/audit.middleware.js';
import { AppError } from '../../../utils/errors.js';
import { getPaginationParams, buildPaginationMeta } from '../../../utils/pagination.js';
import { getUserScope, enforceWarehouseScope } from '../../../utils/warehouse-scope.js';
import { getStockQuantitySummary } from '../stock-additions/stock-additions.service.js';

// ──────────────────────────────────────────────────────────────────────────────
// Sanitise a WarehouseStock record, injecting computed quantity fields
// ──────────────────────────────────────────────────────────────────────────────
const sanitizeStock = (stock) => {
  if (!stock) return stock;
  return {
    ...stock,
    minimumStock: Number(stock.minimumStock),
    reorderLevel: Number(stock.reorderLevel),
    // Computed fields injected by enrichStock(); default to 0 if not present
    quantity: Number(stock.quantity ?? 0),
    reservedQuantity: Number(stock.reservedQuantity ?? 0),
    availableQuantity: Number(stock.availableQuantity ?? 0),
  };
};

// Enrich a list of stock records with computed quantities in parallel
async function enrichStocks(stocks) {
  return Promise.all(
    stocks.map(async (s) => {
      const { quantity, reservedQuantity, availableQuantity } = await getStockQuantitySummary(
        s.warehouseId,
        s.productId,
      );
      return { ...s, quantity, reservedQuantity, availableQuantity };
    }),
  );
}

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
      409,
    );
  }

  const stock = await prisma.$transaction(async (tx) => {
    let newStock;

    if (existingAny && existingAny.isArchived) {
      // Case 2: Soft-deleted (archived) record found → restore with fresh thresholds
      newStock = await tx.warehouseStock.update({
        where: { id: existingAny.id },
        data: {
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
          minimumStock: data.minimumStock ?? 0,
          reorderLevel: data.reorderLevel ?? 0,
          createdById,
        },
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          product: { select: { id: true, name: true, sku: true } },
        },
      });
    }

    // If an initial quantity was supplied, record it as the first addition
    const initialQty = Number(data.quantity) || 0;
    if (initialQty > 0) {
      await tx.productAddedQuantity.create({
        data: {
          warehouseStockId: newStock.id,
          warehouseId: data.warehouseId,
          productId: data.productId,
          previousTotalQty: 0,
          addedQuantity: initialQty,
          currentTotalAvailableQty: initialQty,
          referenceType: 'INITIAL_STOCK',
          notes: data.notes || `Initial stock for ${product.name} in ${warehouse.name}`,
          createdById,
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: createdById,
        title: existingAny ? 'Stock Record Restored' : 'Stock Created',
        message: existingAny
          ? `Restored stock for ${product.name} in ${warehouse.name}.`
          : `Created stock entry for ${product.name} in ${warehouse.name}${initialQty > 0 ? ` with ${initialQty} initial units.` : '.'}`,
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
      initialQuantity: data.quantity,
      restored: Boolean(existingAny),
    },
    req,
  });

  const enriched = await enrichStocks([stock]);
  return sanitizeStock(enriched[0]);
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

  const [stocks, total] = await Promise.all([
    prisma.warehouseStock.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.warehouseStock.count({ where }),
  ]);

  // Enrich each stock record with live computed quantities
  let enriched = await enrichStocks(stocks);

  // Apply low-stock filter after enrichment
  if (filters.lowStock) {
    enriched = enriched.filter((s) => {
      const avail = s.availableQuantity;
      const reorder = Number(s.reorderLevel) || 0;
      const min = Number(s.minimumStock) || 0;
      return (reorder > 0 && avail <= reorder) || (min > 0 && avail <= min);
    });
  }

  return {
    stocks: enriched.map(sanitizeStock),
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export async function getStockById(id, user = null) {
  const stock = await prisma.warehouseStock.findFirst({
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
    },
  });

  if (!stock) throw new AppError('Stock not found', 404);
  await enforceWarehouseScope(user, stock.warehouseId);

  const { quantity, reservedQuantity, availableQuantity } = await getStockQuantitySummary(
    stock.warehouseId,
    stock.productId,
  );
  return sanitizeStock({ ...stock, quantity, reservedQuantity, availableQuantity });
}

export async function updateStock(id, data, createdById, req, user = null) {
  const existing = await prisma.warehouseStock.findFirst({
    where: { id, isArchived: false },
  });
  if (!existing) throw new AppError('Stock not found', 404);
  await enforceWarehouseScope(user, existing.warehouseId);

  const updateData = {};
  if (data.minimumStock !== undefined && data.minimumStock !== Number(existing.minimumStock)) {
    updateData.minimumStock = data.minimumStock;
  }
  if (data.reorderLevel !== undefined && data.reorderLevel !== Number(existing.reorderLevel)) {
    updateData.reorderLevel = data.reorderLevel;
  }

  if (Object.keys(updateData).length === 0) {
    return getStockById(id, user);
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

    await tx.notification.create({
      data: {
        userId: createdById,
        title: 'Stock Thresholds Updated',
        message: `Updated stock thresholds for ${updatedStock.product.name} in ${updatedStock.warehouse.name}`,
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
    oldValues: { minimumStock: existing.minimumStock, reorderLevel: existing.reorderLevel },
    newValues: updateData,
    req,
  });

  const { quantity, reservedQuantity, availableQuantity } = await getStockQuantitySummary(
    stock.warehouseId,
    stock.productId,
  );
  return sanitizeStock({ ...stock, quantity, reservedQuantity, availableQuantity });
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
