import prisma from '../../../config/prisma.js';
import { logAudit } from '../../../middleware/audit.middleware.js';
import { AppError } from '../../../utils/errors.js';
import { getPaginationParams, buildPaginationMeta } from '../../../utils/pagination.js';

export async function createSellingPrice(data, createdById, req) {
  const product = await prisma.product.findFirst({
    where: { id: data.productId, isArchived: false },
  });
  if (!product) throw new AppError('Product not found', 404);

  const warehouse = await prisma.warehouse.findFirst({
    where: { id: data.warehouseId, isArchived: false },
  });
  if (!warehouse) throw new AppError('Warehouse not found', 404);

  const existing = await prisma.warehouseSellingPrice.findFirst({
    where: { productId: data.productId, warehouseId: data.warehouseId, isArchived: false },
  });
  if (existing) {
    throw new AppError('Selling price already exists for this product in this warehouse', 400);
  }

  const archivedExisting = await prisma.warehouseSellingPrice.findFirst({
    where: { productId: data.productId, warehouseId: data.warehouseId, isArchived: true },
  });

  const sellingPrice = await prisma.$transaction(async (tx) => {
    if (archivedExisting) {
      const updatedPrice = await tx.warehouseSellingPrice.update({
        where: { id: archivedExisting.id },
        data: {
          sellingPrice: data.sellingPrice,
          wholesalePrice: data.wholesalePrice,
          status: data.status,
          isArchived: false,
          archivedAt: null,
          updatedById: createdById,
          updatedAt: new Date(),
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true, code: true } },
        },
      });

      await tx.notification.create({
        data: {
          userId: createdById,
          title: 'Warehouse Selling Price Created',
          message: `Created selling price for ${product.name} in ${warehouse.name}`,
          type: 'INVENTORY_PRICE_CREATED',
          createdById,
        },
      });

      return updatedPrice;
    }

    const newPrice = await tx.warehouseSellingPrice.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        sellingPrice: data.sellingPrice,
        wholesalePrice: data.wholesalePrice,
        status: data.status,
        createdById,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    await tx.notification.create({
      data: {
        userId: createdById,
        title: 'Warehouse Selling Price Created',
        message: `Created selling price for ${product.name} in ${warehouse.name}`,
        type: 'INVENTORY_PRICE_CREATED',
        createdById,
      },
    });

    return newPrice;
  });

  await logAudit({
    createdById,
    action: 'PRICE_CREATED',
    entityType: 'WarehouseSellingPrice',
    entityId: sellingPrice.id,
    newValues: { productId: data.productId, warehouseId: data.warehouseId, sellingPrice: data.sellingPrice, wholesalePrice: data.wholesalePrice },
    req,
  });

  return sellingPrice;
}

export async function getSellingPrices(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = { isArchived: false };

  if (filters.warehouseId) where.warehouseId = filters.warehouseId;
  if (filters.productId) where.productId = filters.productId;
  if (filters.status) where.status = filters.status;

  const [sellingPrices, total] = await Promise.all([
    prisma.warehouseSellingPrice.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.warehouseSellingPrice.count({ where }),
  ]);

  return {
    sellingPrices,
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export async function getSellingPriceById(id) {
  const sellingPrice = await prisma.warehouseSellingPrice.findFirst({
    where: { id, isArchived: false },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      warehouse: { select: { id: true, name: true, code: true } },
    },
  });
  if (!sellingPrice) throw new AppError('Selling price not found', 404);
  return sellingPrice;
}

export async function updateSellingPrice(id, data, updatedById, req) {
  const existing = await prisma.warehouseSellingPrice.findFirst({
    where: { id, isArchived: false },
    include: { product: true, warehouse: true },
  });
  if (!existing) throw new AppError('Selling price not found', 404);

  const sellingPrice = await prisma.$transaction(async (tx) => {
    const updatedPrice = await tx.warehouseSellingPrice.update({
      where: { id },
      data: {
        sellingPrice: data.sellingPrice ?? existing.sellingPrice,
        wholesalePrice: data.wholesalePrice ?? existing.wholesalePrice,
        status: data.status ?? existing.status,
        updatedById,
        updatedAt: new Date(),
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    await tx.notification.create({
      data: {
        userId: updatedById,
        title: 'Warehouse Selling Price Updated',
        message: `Updated selling price for ${existing.product.name} in ${existing.warehouse.name}`,
        type: 'INVENTORY_PRICE_UPDATED',
        createdById: updatedById,
      },
    });

    return updatedPrice;
  });

  await logAudit({
    createdById: updatedById,
    action: 'PRICE_UPDATED',
    entityType: 'WarehouseSellingPrice',
    entityId: id,
    oldValues: { sellingPrice: existing.sellingPrice, wholesalePrice: existing.wholesalePrice },
    newValues: { sellingPrice: sellingPrice.sellingPrice, wholesalePrice: sellingPrice.wholesalePrice },
    req,
  });

  return sellingPrice;
}

export async function deleteSellingPrice(id, deletedById, req) {
  const existing = await prisma.warehouseSellingPrice.findFirst({
    where: { id, isArchived: false },
    include: { product: true, warehouse: true },
  });
  if (!existing) throw new AppError('Selling price not found', 404);

  const sellingPrice = await prisma.$transaction(async (tx) => {
    const deletedPrice = await tx.warehouseSellingPrice.update({
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
        title: 'Warehouse Selling Price Deleted',
        message: `Deleted selling price for ${existing.product.name} in ${existing.warehouse.name}`,
        type: 'INVENTORY_PRICE_DELETED',
        createdById: deletedById,
      },
    });

    return deletedPrice;
  });

  await logAudit({
    createdById: deletedById,
    action: 'PRICE_DELETED',
    entityType: 'WarehouseSellingPrice',
    entityId: id,
    oldValues: { isArchived: false },
    newValues: { isArchived: true },
    req,
  });

  return { id: sellingPrice.id, deleted: true };
}
