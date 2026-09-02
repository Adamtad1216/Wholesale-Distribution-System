import prisma from '../../../config/prisma.js';
import { logAudit } from '../../../middleware/audit.middleware.js';
import { AppError } from '../../../utils/errors.js';
import { getPaginationParams, buildPaginationMeta } from '../../../utils/pagination.js';
import { getAssignedWarehouseId, enforceWarehouseScope } from '../../../utils/warehouse-scope.js';

const sanitizeTransfer = (transfer) => {
  if (!transfer) return transfer;
  return {
    ...transfer,
    quantity: Number(transfer.quantity),
  };
};

export async function createTransfer(data, createdById, req, user = null) {
  if (data.fromWarehouseId === data.toWarehouseId) {
    throw new AppError('Source and destination warehouses cannot be the same', 400);
  }

  const assignedWarehouseId = await getAssignedWarehouseId(user);
  if (assignedWarehouseId && data.fromWarehouseId !== assignedWarehouseId) {
    throw new AppError('You can only initiate transfers from your assigned warehouse', 403);
  }

  const fromWarehouse = await prisma.warehouse.findFirst({
    where: { id: data.fromWarehouseId, isArchived: false },
    include: { manager: true },
  });
  if (!fromWarehouse) throw new AppError('Source warehouse not found', 404);

  const toWarehouse = await prisma.warehouse.findFirst({
    where: { id: data.toWarehouseId, isArchived: false },
    include: { manager: true },
  });
  if (!toWarehouse) throw new AppError('Destination warehouse not found', 404);

  const product = await prisma.product.findFirst({
    where: { id: data.productId, isArchived: false },
  });
  if (!product) throw new AppError('Product not found', 404);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Check source warehouse stock
    const sourceStock = await tx.warehouseStock.findFirst({
      where: { warehouseId: data.fromWarehouseId, productId: data.productId, isArchived: false },
    });

    if (!sourceStock || Number(sourceStock.availableQuantity) < Number(data.quantity)) {
      const available = sourceStock ? Number(sourceStock.availableQuantity) : 0;
      throw new AppError(
        `Insufficient available stock in warehouse "${fromWarehouse.name}". Available: ${available}, requested: ${data.quantity}`,
        400
      );
    }

    // 2. Deduct from source warehouse
    const newSourceQty = Number(sourceStock.quantity) - Number(data.quantity);
    const newSourceAvail = Number(sourceStock.availableQuantity) - Number(data.quantity);

    await tx.warehouseStock.update({
      where: { id: sourceStock.id },
      data: {
        quantity: newSourceQty,
        availableQuantity: newSourceAvail,
        updatedById: createdById,
        updatedAt: new Date(),
      },
    });

    // 3. Increment or create destination warehouse stock
    let destStock = await tx.warehouseStock.findFirst({
      where: { warehouseId: data.toWarehouseId, productId: data.productId, isArchived: false },
    });

    if (destStock) {
      const newDestQty = Number(destStock.quantity) + Number(data.quantity);
      const newDestAvail = Number(destStock.availableQuantity) + Number(data.quantity);

      await tx.warehouseStock.update({
        where: { id: destStock.id },
        data: {
          quantity: newDestQty,
          availableQuantity: newDestAvail,
          updatedById: createdById,
          updatedAt: new Date(),
        },
      });
    } else {
      destStock = await tx.warehouseStock.create({
        data: {
          warehouseId: data.toWarehouseId,
          productId: data.productId,
          quantity: data.quantity,
          reservedQuantity: 0,
          availableQuantity: data.quantity,
          minimumStock: 0,
          reorderLevel: 0,
          createdById,
        },
      });
    }

    // 4. Create WarehouseStockTransfer record
    const transfer = await tx.warehouseStockTransfer.create({
      data: {
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        productId: data.productId,
        transferReason: data.transferReason,
        quantity: data.quantity,
        remark: data.remark,
        createdById,
      },
      include: {
        fromWarehouse: { select: { id: true, name: true, code: true } },
        toWarehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true } },
        createdBy: {
          select: {
            id: true,
            username: true,
            person: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // 7. Dynamic Notifications
    // 7a. Initiator Notification
    if (createdById) {
      await tx.notification.create({
        data: {
          userId: createdById,
          title: 'Stock Transfer Dispatched',
          message: `Transferred ${data.quantity} units of ${product.name} from ${fromWarehouse.name} to ${toWarehouse.name}`,
          type: 'INVENTORY_TRANSFER_COMPLETED',
          createdById,
        },
      });
    }

    // 7b. Destination Warehouse Manager Notification
    if (toWarehouse.manager?.personId) {
      const destManagerUser = await tx.user.findFirst({
        where: { personId: toWarehouse.manager.personId, isArchived: false },
      });
      if (destManagerUser && destManagerUser.id !== createdById) {
        await tx.notification.create({
          data: {
            userId: destManagerUser.id,
            title: 'Stock Transfer Received',
            message: `Received ${data.quantity} units of ${product.name} transferred from ${fromWarehouse.name}`,
            type: 'INVENTORY_TRANSFER_RECEIVED',
            createdById,
          },
        });
      }
    }

    // 7c. Source Warehouse Manager Notification
    if (fromWarehouse.manager?.personId) {
      const srcManagerUser = await tx.user.findFirst({
        where: { personId: fromWarehouse.manager.personId, isArchived: false },
      });
      if (srcManagerUser && srcManagerUser.id !== createdById) {
        await tx.notification.create({
          data: {
            userId: srcManagerUser.id,
            title: 'Stock Transfer Outbound',
            message: `${data.quantity} units of ${product.name} transferred out to ${toWarehouse.name}`,
            type: 'INVENTORY_TRANSFER_OUTBOUND',
            createdById,
          },
        });
      }
    }

    // 7d. Dynamic Low Stock Alert for Source Warehouse
    const reorderLevel = Number(sourceStock.reorderLevel || 0);
    const minStock = Number(sourceStock.minimumStock || 0);
    if ((reorderLevel > 0 && newSourceQty <= reorderLevel) || (minStock > 0 && newSourceQty <= minStock)) {
      if (createdById) {
        await tx.notification.create({
          data: {
            userId: createdById,
            title: 'Low Stock Warning',
            message: `Stock for ${product.name} at ${fromWarehouse.name} dropped to ${newSourceQty} (Reorder level: ${reorderLevel})`,
            type: 'INVENTORY_LOW_STOCK_WARNING',
            createdById,
          },
        });
      }
    }

    return transfer;
  });

  // 8. Audit Log
  await logAudit({
    createdById,
    action: 'STOCK_TRANSFERRED',
    entityType: 'WarehouseStockTransfer',
    entityId: result.id,
    newValues: {
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      productId: data.productId,
      quantity: data.quantity,
      transferReason: data.transferReason,
    },
    req,
  });

  return sanitizeTransfer(result);
}

export async function getTransfers(filters, user = null) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = { isArchived: false };

  const assignedWarehouseId = await getAssignedWarehouseId(user);
  if (assignedWarehouseId) {
    if (filters.warehouseId && filters.warehouseId !== assignedWarehouseId) {
      throw new AppError('You are not authorized to view transfers for this warehouse', 403);
    }
    where.OR = [
      { fromWarehouseId: assignedWarehouseId },
      { toWarehouseId: assignedWarehouseId },
    ];
  } else if (filters.warehouseId) {
    where.OR = [
      { fromWarehouseId: filters.warehouseId },
      { toWarehouseId: filters.warehouseId },
    ];
  }
  if (filters.fromWarehouseId) where.fromWarehouseId = filters.fromWarehouseId;
  if (filters.toWarehouseId) where.toWarehouseId = filters.toWarehouseId;
  if (filters.productId) where.productId = filters.productId;
  if (filters.transferReason) where.transferReason = filters.transferReason;

  const [transfers, total] = await Promise.all([
    prisma.warehouseStockTransfer.findMany({
      where,
      include: {
        fromWarehouse: { select: { id: true, name: true, code: true } },
        toWarehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true } },
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
    prisma.warehouseStockTransfer.count({ where }),
  ]);

  return {
    transfers: transfers.map(sanitizeTransfer),
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export async function getTransferById(id, filters = {}, user = null) {
  const where = { id, isArchived: false };

  if (filters.warehouseId) {
    where.OR = [
      { fromWarehouseId: filters.warehouseId },
      { toWarehouseId: filters.warehouseId },
    ];
  }
  if (filters.productId) {
    where.productId = filters.productId;
  }

  const transfer = await prisma.warehouseStockTransfer.findFirst({
    where,
    include: {
      fromWarehouse: { select: { id: true, name: true, code: true } },
      toWarehouse: { select: { id: true, name: true, code: true } },
      product: { select: { id: true, name: true, sku: true } },
      createdBy: {
        select: {
          id: true,
          username: true,
          person: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!transfer) throw new AppError('Stock transfer not found', 404);

  const assignedWarehouseId = await getAssignedWarehouseId(user);
  if (assignedWarehouseId && transfer.fromWarehouseId !== assignedWarehouseId && transfer.toWarehouseId !== assignedWarehouseId) {
    throw new AppError('You are not authorized to view transfers not involving your warehouse', 403);
  }

  return sanitizeTransfer(transfer);
}

export async function updateTransfer(id, data, updatedById, req, user = null) {
  const existing = await prisma.warehouseStockTransfer.findFirst({
    where: { id, isArchived: false },
    include: {
      fromWarehouse: { include: { manager: true } },
      toWarehouse: { include: { manager: true } },
      product: true,
    },
  });

  if (!existing) throw new AppError('Stock transfer not found', 404);

  const assignedWarehouseId = await getAssignedWarehouseId(user);
  if (assignedWarehouseId && existing.fromWarehouseId !== assignedWarehouseId && existing.toWarehouseId !== assignedWarehouseId) {
    throw new AppError('You are not authorized to modify transfers not involving your warehouse', 403);
  }

  const result = await prisma.$transaction(async (tx) => {
    // If quantity is being changed, calculate delta and adjust stock balances
    if (data.quantity !== undefined && Number(data.quantity) !== Number(existing.quantity)) {
      const delta = Number(data.quantity) - Number(existing.quantity);

      if (delta > 0) {
        // Increasing transfer quantity: requires more stock from source warehouse
        const sourceStock = await tx.warehouseStock.findFirst({
          where: { warehouseId: existing.fromWarehouseId, productId: existing.productId, isArchived: false },
        });

        if (!sourceStock || Number(sourceStock.availableQuantity) < delta) {
          const available = sourceStock ? Number(sourceStock.availableQuantity) : 0;
          throw new AppError(
            `Insufficient available stock in warehouse "${existing.fromWarehouse.name}" to increase transfer. Additional required: ${delta}, Available: ${available}`,
            400
          );
        }

        // Deduct additional delta from source warehouse
        await tx.warehouseStock.update({
          where: { id: sourceStock.id },
          data: {
            quantity: Number(sourceStock.quantity) - delta,
            availableQuantity: Number(sourceStock.availableQuantity) - delta,
            updatedById,
            updatedAt: new Date(),
          },
        });

        // Add additional delta to destination warehouse
        const destStock = await tx.warehouseStock.findFirst({
          where: { warehouseId: existing.toWarehouseId, productId: existing.productId, isArchived: false },
        });

        if (destStock) {
          await tx.warehouseStock.update({
            where: { id: destStock.id },
            data: {
              quantity: Number(destStock.quantity) + delta,
              availableQuantity: Number(destStock.availableQuantity) + delta,
              updatedById,
              updatedAt: new Date(),
            },
          });
        } else {
          await tx.warehouseStock.create({
            data: {
              warehouseId: existing.toWarehouseId,
              productId: existing.productId,
              quantity: delta,
              reservedQuantity: 0,
              availableQuantity: delta,
              minimumStock: 0,
              reorderLevel: 0,
              createdById: updatedById,
            },
          });
        }
      } else {
        // Decreasing transfer quantity: return excess stock from destination warehouse back to source
        const returnQty = Math.abs(delta);
        const destStock = await tx.warehouseStock.findFirst({
          where: { warehouseId: existing.toWarehouseId, productId: existing.productId, isArchived: false },
        });

        if (!destStock || Number(destStock.availableQuantity) < returnQty) {
          const available = destStock ? Number(destStock.availableQuantity) : 0;
          throw new AppError(
            `Cannot reduce transfer quantity: destination warehouse "${existing.toWarehouse.name}" has insufficient available stock to return. Required: ${returnQty}, Available: ${available}`,
            400
          );
        }

        // Deduct returnQty from destination warehouse
        await tx.warehouseStock.update({
          where: { id: destStock.id },
          data: {
            quantity: Number(destStock.quantity) - returnQty,
            availableQuantity: Number(destStock.availableQuantity) - returnQty,
            updatedById,
            updatedAt: new Date(),
          },
        });

        // Add returnQty back to source warehouse
        const sourceStock = await tx.warehouseStock.findFirst({
          where: { warehouseId: existing.fromWarehouseId, productId: existing.productId, isArchived: false },
        });

        if (sourceStock) {
          await tx.warehouseStock.update({
            where: { id: sourceStock.id },
            data: {
              quantity: Number(sourceStock.quantity) + returnQty,
              availableQuantity: Number(sourceStock.availableQuantity) + returnQty,
              updatedById,
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    // Update the transfer record
    const updated = await tx.warehouseStockTransfer.update({
      where: { id },
      data: {
        ...(data.transferReason && { transferReason: data.transferReason }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.remark !== undefined && { remark: data.remark }),
        updatedById,
        updatedAt: new Date(),
      },
      include: {
        fromWarehouse: { select: { id: true, name: true, code: true } },
        toWarehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true } },
        createdBy: {
          select: {
            id: true,
            username: true,
            person: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Dynamic Notifications
    if (updatedById) {
      await tx.notification.create({
        data: {
          userId: updatedById,
          title: 'Stock Transfer Updated',
          message: `Stock transfer for ${existing.product.name} between ${existing.fromWarehouse.name} and ${existing.toWarehouse.name} was updated`,
          type: 'INVENTORY_TRANSFER_UPDATED',
          createdById: updatedById,
        },
      });
    }

    return updated;
  });

  await logAudit({
    createdById: updatedById,
    action: 'STOCK_TRANSFER_UPDATED',
    entityType: 'WarehouseStockTransfer',
    entityId: id,
    oldValues: {
      transferReason: existing.transferReason,
      quantity: existing.quantity,
      remark: existing.remark,
    },
    newValues: {
      transferReason: data.transferReason,
      quantity: data.quantity,
      remark: data.remark,
    },
    req,
  });

  return sanitizeTransfer(result);
}

export async function deleteTransfer(id, deletedById, req, user = null) {
  const existing = await prisma.warehouseStockTransfer.findFirst({
    where: { id, isArchived: false },
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      product: true,
    },
  });

  if (!existing) throw new AppError('Stock transfer not found', 404);

  const assignedWarehouseId = await getAssignedWarehouseId(user);
  if (assignedWarehouseId && existing.fromWarehouseId !== assignedWarehouseId && existing.toWarehouseId !== assignedWarehouseId) {
    throw new AppError('You are not authorized to delete transfers not involving your warehouse', 403);
  }

  const transferQty = Number(existing.quantity);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify destination warehouse has sufficient available stock to reverse
    const destStock = await tx.warehouseStock.findFirst({
      where: { warehouseId: existing.toWarehouseId, productId: existing.productId, isArchived: false },
    });

    if (!destStock || Number(destStock.availableQuantity) < transferQty) {
      const available = destStock ? Number(destStock.availableQuantity) : 0;
      throw new AppError(
        `Cannot reverse/delete stock transfer: destination warehouse "${existing.toWarehouse.name}" does not have enough available stock (some has already been consumed or reserved). Required: ${transferQty}, Available: ${available}`,
        400
      );
    }

    // 2. Deduct from destination warehouse
    await tx.warehouseStock.update({
      where: { id: destStock.id },
      data: {
        quantity: Number(destStock.quantity) - transferQty,
        availableQuantity: Number(destStock.availableQuantity) - transferQty,
        updatedById: deletedById,
        updatedAt: new Date(),
      },
    });

    // 3. Increment back into source warehouse
    const sourceStock = await tx.warehouseStock.findFirst({
      where: { warehouseId: existing.fromWarehouseId, productId: existing.productId, isArchived: false },
    });

    if (sourceStock) {
      await tx.warehouseStock.update({
        where: { id: sourceStock.id },
        data: {
          quantity: Number(sourceStock.quantity) + transferQty,
          availableQuantity: Number(sourceStock.availableQuantity) + transferQty,
          updatedById: deletedById,
          updatedAt: new Date(),
        },
      });
    } else {
      await tx.warehouseStock.create({
        data: {
          warehouseId: existing.fromWarehouseId,
          productId: existing.productId,
          quantity: transferQty,
          reservedQuantity: 0,
          availableQuantity: transferQty,
          minimumStock: 0,
          reorderLevel: 0,
          createdById: deletedById,
        },
      });
    }

    // 4. Soft-delete the transfer record
    const deleted = await tx.warehouseStockTransfer.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        updatedById: deletedById,
        updatedAt: new Date(),
      },
    });

    // 5. Dynamic Notifications
    if (deletedById) {
      await tx.notification.create({
        data: {
          userId: deletedById,
          title: 'Stock Transfer Reversed',
          message: `Reversed transfer of ${transferQty} units of ${existing.product.name}. Stock returned from ${existing.toWarehouse.name} to ${existing.fromWarehouse.name}`,
          type: 'INVENTORY_TRANSFER_DELETED',
          createdById: deletedById,
        },
      });
    }

    if (existing.toWarehouse.manager?.personId) {
      const destMgr = await tx.user.findFirst({
        where: { personId: existing.toWarehouse.manager.personId, isArchived: false },
      });
      if (destMgr && destMgr.id !== deletedById) {
        await tx.notification.create({
          data: {
            userId: destMgr.id,
            title: 'Stock Transfer Cancelled & Reversed',
            message: `${transferQty} units of ${existing.product.name} returned to ${existing.fromWarehouse.name}`,
            type: 'INVENTORY_TRANSFER_REVERSED',
            createdById: deletedById,
          },
        });
      }
    }

    if (existing.fromWarehouse.manager?.personId) {
      const srcMgr = await tx.user.findFirst({
        where: { personId: existing.fromWarehouse.manager.personId, isArchived: false },
      });
      if (srcMgr && srcMgr.id !== deletedById) {
        await tx.notification.create({
          data: {
            userId: srcMgr.id,
            title: 'Stock Returned from Cancelled Transfer',
            message: `${transferQty} units of ${existing.product.name} returned from ${existing.toWarehouse.name}`,
            type: 'INVENTORY_TRANSFER_RETURNED',
            createdById: deletedById,
          },
        });
      }
    }

    return deleted;
  });

  await logAudit({
    createdById: deletedById,
    action: 'STOCK_TRANSFER_DELETED',
    entityType: 'WarehouseStockTransfer',
    entityId: id,
    oldValues: { isArchived: false, quantity: existing.quantity },
    newValues: { isArchived: true, reversedQuantity: transferQty },
    req,
  });

  return { id: result.id, deleted: true };
}

