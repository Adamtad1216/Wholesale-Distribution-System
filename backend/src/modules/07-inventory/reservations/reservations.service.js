import prisma from '../../../config/prisma.js';
import { logAudit } from '../../../middleware/audit.middleware.js';
import { AppError } from '../../../utils/errors.js';
import { getPaginationParams, buildPaginationMeta } from '../../../utils/pagination.js';
import { getUserScope, getAssignedWarehouseId, enforceWarehouseScope } from '../../../utils/warehouse-scope.js';
import { getStockQuantitySummary } from '../stock-additions/stock-additions.service.js';

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

  // Compute live available quantity (total additions minus active reservations)
  const { availableQuantity } = await getStockQuantitySummary(data.warehouseId, data.productId);
  if (availableQuantity < data.quantity) {
    throw new AppError(`Insufficient available stock. Available: ${availableQuantity}, Requested: ${data.quantity}`, 400);
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
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: { select: { id: true, name: true, abbreviation: true } },
            images: { where: { isArchived: false }, select: { id: true, imageUrl: true, isPrimary: true } },
          },
        },
        salesOrder: { select: { id: true, orderNumber: true, status: true } },
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

  if (user) {
    const scope = await getUserScope(user);
    if (!scope.isGlobal) {
      const allowedWarehouseIds = scope.warehouseIds || [];
      if (filters.warehouseId) {
        if (!allowedWarehouseIds.includes(filters.warehouseId)) {
          throw new AppError('You are not authorized to view reservations for this warehouse', 403);
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
  if (filters.salesOrderId) where.salesOrderId = filters.salesOrderId;
  if (filters.status) where.status = filters.status;

  const [reservations, total] = await Promise.all([
    prisma.stockReservation.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            branch: { select: { id: true, name: true } },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: { select: { id: true, name: true, abbreviation: true } },
            sellingPrice: true,
            wholesalePrice: true,
            images: { where: { isArchived: false }, select: { id: true, imageUrl: true, isPrimary: true } },
          },
        },
        salesOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            customer: {
              select: {
                id: true,
                customerCode: true,
                customerType: true,
                person: { select: { firstName: true, lastName: true } },
                organization: { select: { name: true } },
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            person: { select: { firstName: true, lastName: true } },
          },
        },
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
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: { select: { id: true, name: true, abbreviation: true } },
            images: { where: { isArchived: false }, select: { id: true, imageUrl: true, isPrimary: true } },
          },
        },
        salesOrder: { select: { id: true, orderNumber: true, status: true } },
      },
    });

    // No direct column update needed — reservedQuantity is computed live from active reservations

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

  if (existing.status === 'FULFILLED') {
    throw new AppError('Cannot delete a fulfilled reservation. The associated items have already been allocated or dispatched for the sales order.', 400);
  }

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
    // No direct column update needed — reservedQuantity is computed live from active reservations
    if (existing.status === 'RESERVED' || existing.status === 'PARTIALLY_FULFILLED') {
      // status update is sufficient; computed available will auto-update
      await tx.stockReservation.update({
        where: { id },
        data: { status: 'RELEASED', releasedAt: new Date(), updatedById: deletedById },
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

export async function getReservationById(id, user = null) {
  const reservation = await prisma.stockReservation.findFirst({
    where: { id, isArchived: false },
    include: {
      warehouse: {
        include: {
          branch: { select: { id: true, name: true } },
          manager: { select: { id: true, person: { select: { firstName: true, lastName: true } } } },
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          unit: { select: { id: true, name: true, abbreviation: true } },
          sellingPrice: true,
          wholesalePrice: true,
          images: { where: { isArchived: false }, select: { id: true, imageUrl: true, isPrimary: true } },
        },
      },
      salesOrder: {
        include: {
          customer: {
            select: {
              id: true,
              customerCode: true,
              customerType: true,
              person: { select: { firstName: true, lastName: true, phone: true, email: true } },
              organization: { select: { name: true, phone: true, email: true } },
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          username: true,
          person: { select: { firstName: true, lastName: true } },
        },
      },
      updatedBy: {
        select: {
          id: true,
          username: true,
          person: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!reservation) throw new AppError('Stock reservation not found', 404);
  await enforceWarehouseScope(user, reservation.warehouseId);

  // Compute live stock summary
  const liveStock = await getStockQuantitySummary(reservation.warehouseId, reservation.productId);

  return {
    ...reservation,
    currentStock: {
      quantity: liveStock.quantity,
      availableQuantity: liveStock.availableQuantity,
      reservedQuantity: liveStock.reservedQuantity,
    },
  };
}

export async function approveOrRejectReservation(id, data, createdById, req, user = null) {
  const existing = await prisma.stockReservation.findFirst({
    where: { id, isArchived: false },
    include: { warehouse: true, product: true, salesOrder: true },
  });

  if (!existing) throw new AppError('Stock reservation not found', 404);
  await enforceWarehouseScope(user, existing.warehouseId);

  // Prevent double-processing
  if (['FULFILLED', 'RELEASED', 'CANCELLED'].includes(existing.status)) {
    throw new AppError(
      `Stock reservation has already been ${existing.status.toLowerCase()}. No further approval action is needed.`,
      400
    );
  }

  const action = data.action || (data.status === 'RELEASED' || data.status === 'CANCELLED' ? 'REJECT' : 'APPROVE');

  if (action === 'REJECT' || action === 'RELEASE') {
    return releaseReservation(id, existing.quantity, createdById, req, user);
  }

  const targetStatus = data.status || 'FULFILLED';
  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.stockReservation.update({
      where: { id },
      data: {
        status: targetStatus,
        updatedById: createdById,
        updatedAt: new Date(),
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            branch: { select: { id: true, name: true } },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: { select: { id: true, name: true, abbreviation: true } },
            images: { where: { isArchived: false }, select: { id: true, imageUrl: true, isPrimary: true } },
          },
        },
        salesOrder: { select: { id: true, orderNumber: true, status: true } },
      },
    });

    // Notify the creator that the reservation was confirmed
    if (existing.createdById) {
      await tx.notification.create({
        data: {
          userId: existing.createdById,
          title: 'Stock Reservation Confirmed',
          message: `Stock reservation of ${Number(existing.quantity)} units of ${existing.product.name} for order #${existing.salesOrder?.orderNumber || existing.salesOrderId?.slice(0, 8)} has been confirmed and allocated.`,
          type: 'INVENTORY_RESERVATION_CONFIRMED',
          createdById,
        },
      });
    }

    // Notify the approver as well (if different)
    if (createdById && createdById !== existing.createdById) {
      await tx.notification.create({
        data: {
          userId: createdById,
          title: 'Reservation Approval Recorded',
          message: `You confirmed the allocation of ${Number(existing.quantity)} units of ${existing.product.name} in ${existing.warehouse.name}.`,
          type: 'INVENTORY_RESERVATION_CONFIRMED',
          createdById,
        },
      });
    }

    return reservation;
  });

  await logAudit({
    createdById,
    action: 'RESERVATION_APPROVED',
    entityType: 'StockReservation',
    entityId: id,
    oldValues: { status: existing.status },
    newValues: { status: targetStatus, approvedBy: createdById, notes: data.notes },
    req,
  });

  return result;
}

export async function updateReservation(id, data, updatedById, req, user = null) {
  const existing = await prisma.stockReservation.findFirst({
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
      salesOrder: { select: { id: true, orderNumber: true, status: true } },
    },
  });
  if (!existing) throw new AppError('Stock reservation not found', 404);
  await enforceWarehouseScope(user, existing.warehouseId);

  if (existing.status !== 'RESERVED') {
    // If reservation has already been fulfilled, released or cancelled, allow updating salesOrderId reference without altering stock
    const updated = await prisma.stockReservation.update({
      where: { id },
      data: {
        ...(data.salesOrderId && { salesOrderId: data.salesOrderId }),
        updatedById,
        updatedAt: new Date(),
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
        salesOrder: { select: { id: true, orderNumber: true, status: true } },
      },
    });

    await logAudit({
      createdById: updatedById,
      action: 'RESERVATION_UPDATED',
      entityType: 'StockReservation',
      entityId: id,
      oldValues: { salesOrderId: existing.salesOrderId },
      newValues: { salesOrderId: updated.salesOrderId },
      req,
    });

    return updated;
  }

  const newWarehouseId = data.warehouseId || existing.warehouseId;
  const newProductId = data.productId || existing.productId;
  const newQuantity = data.quantity !== undefined ? Number(data.quantity) : Number(existing.quantity);
  const newSalesOrderId = data.salesOrderId || existing.salesOrderId;

  if (newWarehouseId !== existing.warehouseId) {
    await enforceWarehouseScope(user, newWarehouseId);
  }

  const result = await prisma.$transaction(async (tx) => {
    // If warehouse or product changed, check new availability
    if (newWarehouseId !== existing.warehouseId || newProductId !== existing.productId) {
      const newSummary = await getStockQuantitySummary(newWarehouseId, newProductId);
      if (newSummary.availableQuantity < newQuantity) {
        throw new AppError(
          `Insufficient available stock in selected warehouse. Available: ${newSummary.availableQuantity}, Requested: ${newQuantity}`,
          400
        );
      }
    } else if (newQuantity !== Number(existing.quantity)) {
      const delta = newQuantity - Number(existing.quantity);
      if (delta > 0) {
        const { availableQuantity } = await getStockQuantitySummary(existing.warehouseId, existing.productId);
        // Available already excludes the current reservation so compare net
        if (availableQuantity < delta) {
          throw new AppError(
            `Insufficient available stock to increase reservation. Additional required: ${delta}, Available: ${availableQuantity}`,
            400
          );
        }
      }
    }

    const updated = await tx.stockReservation.update({
      where: { id },
      data: {
        warehouseId: newWarehouseId,
        productId: newProductId,
        quantity: newQuantity,
        salesOrderId: newSalesOrderId,
        updatedById,
        updatedAt: new Date(),
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
        salesOrder: { select: { id: true, orderNumber: true, status: true } },
      },
    });

    return updated;
  });

  await logAudit({
    createdById: updatedById,
    action: 'RESERVATION_UPDATED',
    entityType: 'StockReservation',
    entityId: id,
    oldValues: {
      quantity: Number(existing.quantity),
      warehouseId: existing.warehouseId,
      productId: existing.productId,
      salesOrderId: existing.salesOrderId,
    },
    newValues: {
      quantity: Number(result.quantity),
      warehouseId: result.warehouseId,
      productId: result.productId,
      salesOrderId: result.salesOrderId,
    },
    req,
  });

  return result;
}

/**
 * Retrieve sales orders eligible for inventory stock reservations
 */
export async function getReservableSalesOrders({ warehouseId, limit = 100, search } = {}) {
  const where = {
    isArchived: false,
    status: {
      in: [
        'APPROVED',
        'SALES_REP_APPROVED',
        'PENDING_REVIEW',
        'WAREHOUSE_PREPARATION_SCHEDULED',
        'PREPARING',
        'RESERVED',
        'DRAFT',
      ],
    },
  };

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { organization: { name: { contains: search, mode: 'insensitive' } } } },
      { customer: { person: { firstName: { contains: search, mode: 'insensitive' } } } },
      { customer: { person: { lastName: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const orders = await prisma.salesOrder.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      warehouseId: true,
      requiredDate: true,
      createdAt: true,
      warehouse: {
        select: { id: true, name: true, code: true },
      },
      customer: {
        select: {
          id: true,
          person: { select: { firstName: true, lastName: true } },
          organization: { select: { name: true } },
        },
      },
      items: {
        where: { isArchived: false },
        select: {
          id: true,
          productId: true,
          quantity: true,
          product: {
            select: { id: true, name: true, sku: true },
          },
        },
      },
      reservations: {
        where: { isArchived: false },
        select: { id: true, productId: true, quantity: true, status: true },
      },
    },
  });

  return orders;
}


