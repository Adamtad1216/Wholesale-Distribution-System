import prisma from '../../../config/prisma.js';
import { logAudit } from '../../../middleware/audit.middleware.js';
import { AppError } from '../../../utils/errors.js';
import { getPaginationParams, buildPaginationMeta } from '../../../utils/pagination.js';
import { getAssignedWarehouseId, enforceWarehouseScope } from '../../../utils/warehouse-scope.js';

export async function createReservation(data, createdById, req, user = null) {
  await enforceWarehouseScope(user, data.warehouseId);
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: data.warehouseId, isArchived: false },
  });
  if (!warehouse) throw new AppError('Warehouse not found', 404);

  const product = await prisma.product.findFirst({
    where: { id: data.productId, isArchived: false },
  });
  if (!product) throw new AppError('Product not found', 404);

  const stock = await prisma.warehouseStock.findFirst({
    where: { warehouseId: data.warehouseId, productId: data.productId, isArchived: false },
  });
  if (!stock) throw new AppError('No stock found', 404);

  if (Number(stock.availableQuantity) < data.quantity) {
    throw new AppError('Insufficient available stock', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.stockReservation.create({
      data: {
        salesOrderId: data.salesOrderId,
        warehouseId: data.warehouseId,
        productId: data.productId,
        quantity: data.quantity,
        status: 'RESERVED',
        createdById,
      },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true } },
        salesOrder: { select: { id: true, orderNumber: true, status: true } },
      },
    });

    await tx.warehouseStock.update({
      where: { id: stock.id },
      data: {
        reservedQuantity: { increment: data.quantity },
        availableQuantity: { decrement: data.quantity },
        updatedById: createdById,
        updatedAt: new Date(),
      },
    });

    // Create notification
    await tx.notification.create({
      data: {
        userId: createdById,
        title: 'Stock Reserved',
        message: `Reserved ${data.quantity} units of ${product.name} in ${warehouse.name}`,
        type: 'INVENTORY_RESERVATION_CREATED',
        createdById,
      },
    });

    return reservation;
  });

  await logAudit({
    createdById,
    action: 'RESERVATION_CREATED',
    entityType: 'StockReservation',
    entityId: result.id,
    newValues: { quantity: data.quantity, warehouseId: data.warehouseId, productId: data.productId, salesOrderId: data.salesOrderId },
    req,
  });

  return result;
}

export async function getReservations(filters, user = null) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = { isArchived: false };

  const assignedWarehouseId = await getAssignedWarehouseId(user);
  if (assignedWarehouseId) {
    if (filters.warehouseId && filters.warehouseId !== assignedWarehouseId) {
      throw new AppError('You are not authorized to view reservations for this warehouse', 403);
    }
    where.warehouseId = assignedWarehouseId;
  } else if (filters.warehouseId) {
    where.warehouseId = filters.warehouseId;
  }

  if (filters.productId) where.productId = filters.productId;
  if (filters.salesOrderId) where.salesOrderId = filters.salesOrderId;
  if (filters.status) where.status = filters.status;

  const [reservations, total] = await Promise.all([
    prisma.stockReservation.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true } },
        salesOrder: { select: { id: true, orderNumber: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.stockReservation.count({ where }),
  ]);

  return {
    reservations,
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export async function releaseReservation(id, quantity, createdById, req, user = null) {
  const existing = await prisma.stockReservation.findFirst({
    where: { id, isArchived: false },
    include: { warehouse: true, product: true },
  });
  if (!existing) throw new AppError('Reservation not found', 404);
  await enforceWarehouseScope(user, existing.warehouseId);
  if (existing.status === 'RELEASED' || existing.status === 'CANCELLED') {
    throw new AppError('Reservation already released or cancelled', 400);
  }

  const releaseQty = quantity || existing.quantity;

  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.stockReservation.update({
      where: { id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
        updatedById: createdById,
        updatedAt: new Date(),
      },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true } },
        salesOrder: { select: { id: true, orderNumber: true, status: true } },
      },
    });

    await tx.warehouseStock.updateMany({
      where: { warehouseId: existing.warehouseId, productId: existing.productId },
      data: {
        reservedQuantity: { decrement: releaseQty },
        availableQuantity: { increment: releaseQty },
        updatedById: createdById,
        updatedAt: new Date(),
      },
    });

    // Create notification
    await tx.notification.create({
      data: {
        userId: createdById,
        title: 'Stock Reservation Released',
        message: `Released ${releaseQty} units of ${existing.product.name} in ${existing.warehouse.name}`,
        type: 'INVENTORY_RESERVATION_RELEASED',
        createdById,
      },
    });

    return reservation;
  });

  await logAudit({
    createdById,
    action: 'RESERVATION_RELEASED',
    entityType: 'StockReservation',
    entityId: id,
    oldValues: { status: existing.status },
    newValues: { status: 'RELEASED', releasedQuantity: releaseQty },
    req,
  });

  return result;
}

export async function deleteReservation(id, deletedById, req, user = null) {
  const existing = await prisma.stockReservation.findFirst({
    where: { id, isArchived: false },
    include: { warehouse: true, product: true },
  });
  if (!existing) throw new AppError('Stock reservation not found', 404);
  await enforceWarehouseScope(user, existing.warehouseId);

  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.stockReservation.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        updatedById: deletedById,
        updatedAt: new Date(),
      },
    });

    // Release reserved quantity back to stock if still reserved
    if (existing.status === 'RESERVED' || existing.status === 'PARTIALLY_FULFILLED') {
      await tx.warehouseStock.updateMany({
        where: { warehouseId: existing.warehouseId, productId: existing.productId },
        data: {
          reservedQuantity: { decrement: Number(existing.quantity) },
          availableQuantity: { increment: Number(existing.quantity) },
          updatedById: deletedById,
          updatedAt: new Date(),
        },
      });
    }

    // Create notification
    await tx.notification.create({
      data: {
        userId: deletedById,
        title: 'Stock Reservation Deleted',
        message: `Deleted reservation for ${existing.product.name} in ${existing.warehouse.name}`,
        type: 'INVENTORY_RESERVATION_DELETED',
        createdById: deletedById,
      },
    });

    return reservation;
  });

  await logAudit({
    createdById: deletedById,
    action: 'RESERVATION_DELETED',
    entityType: 'StockReservation',
    entityId: id,
    oldValues: { isArchived: false },
    newValues: { isArchived: true },
    req,
  });

  return { id: result.id, deleted: true };
}
