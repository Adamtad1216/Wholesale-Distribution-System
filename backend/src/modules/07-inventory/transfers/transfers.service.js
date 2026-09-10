import prisma from '../../../config/prisma.js';
import { logAudit } from '../../../middleware/audit.middleware.js';
import { AppError } from '../../../utils/errors.js';
import { getPaginationParams, buildPaginationMeta } from '../../../utils/pagination.js';
import {
  getUserScope,
  getAssignedWarehouseId,
  enforceWarehouseScope,
  enforceTransferSourceScope,
  enforceTransferAccess,
} from '../../../utils/warehouse-scope.js';

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

  await enforceTransferSourceScope(user, data.fromWarehouseId);

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
    // 1. Check source warehouse has enough AVAILABLE stock to hold
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

    // 2. Hold (reserve) source available quantity — total quantity NOT changed yet
    //    Stock only physically moves once the transfer is APPROVED.
    await tx.warehouseStock.update({
      where: { id: sourceStock.id },
      data: {
        availableQuantity: Number(sourceStock.availableQuantity) - Number(data.quantity),
        updatedById: createdById,
        updatedAt: new Date(),
      },
    });

    // 3. Create the transfer record (status defaults to PENDING)
    const transfer = await tx.warehouseStockTransfer.create({
      data: {
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        productId: data.productId,
        transferReason: data.transferReason,
        quantity: data.quantity,
        remark: data.remark,
        status: 'PENDING',
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

    // 4. Notify initiator
    if (createdById) {
      await tx.notification.create({
        data: {
          userId: createdById,
          title: 'Stock Transfer Pending Approval',
          message: `Transfer of ${data.quantity} units of ${product.name} from ${fromWarehouse.name} to ${toWarehouse.name} is pending approval.`,
          type: 'INVENTORY_TRANSFER_COMPLETED',
          createdById,
        },
      });
    }

    // 5. Notify destination warehouse manager that a transfer is incoming and pending
    if (toWarehouse.manager?.personId) {
      const destManagerUser = await tx.user.findFirst({
        where: { personId: toWarehouse.manager.personId, isArchived: false },
      });
      if (destManagerUser && destManagerUser.id !== createdById) {
        await tx.notification.create({
          data: {
            userId: destManagerUser.id,
            title: 'Incoming Stock Transfer — Awaiting Approval',
            message: `${data.quantity} units of ${product.name} are pending transfer from ${fromWarehouse.name}. Review and approve to receive stock.`,
            type: 'INVENTORY_TRANSFER_RECEIVED',
            createdById,
          },
        });
      }
    }

    // 6. Notify source warehouse manager
    if (fromWarehouse.manager?.personId) {
      const srcManagerUser = await tx.user.findFirst({
        where: { personId: fromWarehouse.manager.personId, isArchived: false },
      });
      if (srcManagerUser && srcManagerUser.id !== createdById) {
        await tx.notification.create({
          data: {
            userId: srcManagerUser.id,
            title: 'Stock Transfer Initiated',
            message: `${data.quantity} units of ${product.name} are being dispatched to ${toWarehouse.name} (pending approval).`,
            type: 'INVENTORY_TRANSFER_OUTBOUND',
            createdById,
          },
        });
      }
    }

    return transfer;
  });

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
      status: 'PENDING',
    },
    req,
  });

  return sanitizeTransfer(result);
}

export async function getTransfers(filters, user = null) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = { isArchived: false };

  if (user) {
    const scope = await getUserScope(user);
    if (!scope.isGlobal) {
      const allowedWarehouseIds = scope.warehouseIds || [];
      if (filters.warehouseId) {
        if (!allowedWarehouseIds.includes(filters.warehouseId)) {
          throw new AppError('You are not authorized to view transfers for this warehouse', 403);
        }
        where.OR = [
          { fromWarehouseId: filters.warehouseId },
          { toWarehouseId: filters.warehouseId },
        ];
      } else {
        where.OR = [
          { fromWarehouseId: { in: allowedWarehouseIds } },
          { toWarehouseId: { in: allowedWarehouseIds } },
        ];
      }
    } else if (filters.warehouseId) {
      where.OR = [
        { fromWarehouseId: filters.warehouseId },
        { toWarehouseId: filters.warehouseId },
      ];
    }
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
        approver: {
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
      fromWarehouse: {
        select: {
          id: true,
          name: true,
          code: true,
          branch: { select: { id: true, name: true } },
        },
      },
      toWarehouse: {
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
          sellingPrice: true,
          wholesalePrice: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          username: true,
          person: { select: { firstName: true, lastName: true } },
        },
      },
      approver: {
        select: {
          id: true,
          username: true,
          person: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!transfer) throw new AppError('Stock transfer not found', 404);

  await enforceTransferAccess(user, transfer);

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

  await enforceTransferAccess(user, existing);

  const isPending = !existing.status || existing.status === 'PENDING';

  const result = await prisma.$transaction(async (tx) => {
    // If quantity is being changed, adjust only the source available quantity hold
    // (the transfer is still PENDING — no stock has physically moved yet)
    if (isPending && data.quantity !== undefined && Number(data.quantity) !== Number(existing.quantity)) {
      const delta = Number(data.quantity) - Number(existing.quantity);

      if (delta > 0) {
        // Increasing transfer quantity: hold more source available stock
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

        // Extend the source hold by delta
        await tx.warehouseStock.update({
          where: { id: sourceStock.id },
          data: {
            availableQuantity: Number(sourceStock.availableQuantity) - delta,
            updatedById,
            updatedAt: new Date(),
          },
        });
      } else {
        // Decreasing transfer quantity: release partial hold back to source available
        const releaseQty = Math.abs(delta);
        const sourceStock = await tx.warehouseStock.findFirst({
          where: { warehouseId: existing.fromWarehouseId, productId: existing.productId, isArchived: false },
        });

        if (sourceStock) {
          await tx.warehouseStock.update({
            where: { id: sourceStock.id },
            data: {
              availableQuantity: Number(sourceStock.availableQuantity) + releaseQty,
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
        ...(isPending && data.quantity !== undefined && { quantity: data.quantity }),
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

  await enforceTransferAccess(user, existing);

  const transferQty = Number(existing.quantity);
  const isPending = !existing.status || existing.status === 'PENDING';
  const isApproved = existing.status === 'APPROVED';

  const result = await prisma.$transaction(async (tx) => {
    if (isPending) {
      // Transfer was never executed — just release the source availability hold
      const sourceStock = await tx.warehouseStock.findFirst({
        where: { warehouseId: existing.fromWarehouseId, productId: existing.productId, isArchived: false },
      });
      if (sourceStock) {
        await tx.warehouseStock.update({
          where: { id: sourceStock.id },
          data: {
            availableQuantity: Number(sourceStock.availableQuantity) + transferQty,
            updatedById: deletedById,
            updatedAt: new Date(),
          },
        });
      }
    } else if (isApproved) {
      // Transfer was approved and stock moved — full reversal needed.
      //
      // Professional policy:
      //   • We ALWAYS reverse the physical quantity count (source +, destination −)
      //     regardless of how much of the destination stock is still available.
      //   • The availableQuantity deduction on the destination is CLAMPED to whatever
      //     is actually available (≥ 0), avoiding a negative value.
      //   • This handles the realistic case where destination stock was partially or
      //     fully consumed, reserved, or further transferred after the initial approval.

      const destStock = await tx.warehouseStock.findFirst({
        where: { warehouseId: existing.toWarehouseId, productId: existing.productId },
      });

      if (destStock && !destStock.isArchived) {
        // Clamp availableQty deduction — never go below 0
        const destAvail = Number(destStock.availableQuantity);
        const availDeduct = Math.min(destAvail, transferQty);

        await tx.warehouseStock.update({
          where: { id: destStock.id },
          data: {
            quantity: Math.max(0, Number(destStock.quantity) - transferQty),
            availableQuantity: Math.max(0, destAvail - availDeduct),
            updatedById: deletedById,
            updatedAt: new Date(),
          },
        });
      } else if (destStock && destStock.isArchived) {
        // Destination stock was archived after the transfer — nothing to deduct from
        // (its quantity is already considered 0 by the system)
      }
      // If no dest record exists at all, stock was already fully removed — nothing to do

      // Restore source warehouse using upsert-restore pattern:
      //   • Active record → update quantity + availableQuantity
      //   • Archived record → un-archive and restore
      //   • No record → create fresh (with collision protection)
      const sourceStock = await tx.warehouseStock.findFirst({
        where: { warehouseId: existing.fromWarehouseId, productId: existing.productId },
      });

      if (sourceStock && !sourceStock.isArchived) {
        // Active source record — just add stock back
        await tx.warehouseStock.update({
          where: { id: sourceStock.id },
          data: {
            quantity: Number(sourceStock.quantity) + transferQty,
            availableQuantity: Number(sourceStock.availableQuantity) + transferQty,
            updatedById: deletedById,
            updatedAt: new Date(),
          },
        });
      } else if (sourceStock && sourceStock.isArchived) {
        // Archived source record — restore it with the reversed quantity
        await tx.warehouseStock.update({
          where: { id: sourceStock.id },
          data: {
            quantity: transferQty,
            reservedQuantity: 0,
            availableQuantity: transferQty,
            isArchived: false,
            archivedAt: null,
            updatedById: deletedById,
            updatedAt: new Date(),
          },
        });
      } else {
        // No source record exists at all — create fresh
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
    }
    // For REJECTED transfers: stock was already restored on rejection — nothing to undo

    // Soft-delete the transfer record
    const deleted = await tx.warehouseStockTransfer.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        updatedById: deletedById,
        updatedAt: new Date(),
      },
    });

    // Notifications
    if (deletedById) {
      await tx.notification.create({
        data: {
          userId: deletedById,
          title: isPending ? 'Stock Transfer Cancelled' : 'Stock Transfer Reversed',
          message: isPending
            ? `Cancelled pending transfer of ${transferQty} units of ${existing.product.name} from ${existing.fromWarehouse.name} to ${existing.toWarehouse.name}. Hold released.`
            : `Reversed approved transfer of ${transferQty} units of ${existing.product.name}. Stock returned from ${existing.toWarehouse.name} to ${existing.fromWarehouse.name}.`,
          type: 'INVENTORY_TRANSFER_DELETED',
          createdById: deletedById,
        },
      });
    }

    if (isApproved && existing.toWarehouse.manager?.personId) {
      const destMgr = await tx.user.findFirst({
        where: { personId: existing.toWarehouse.manager.personId, isArchived: false },
      });
      if (destMgr && destMgr.id !== deletedById) {
        await tx.notification.create({
          data: {
            userId: destMgr.id,
            title: 'Stock Transfer Reversed',
            message: `${transferQty} units of ${existing.product.name} returned to ${existing.fromWarehouse.name}`,
            type: 'INVENTORY_TRANSFER_REVERSED',
            createdById: deletedById,
          },
        });
      }
    }

    if (isApproved && existing.fromWarehouse.manager?.personId) {
      const srcMgr = await tx.user.findFirst({
        where: { personId: existing.fromWarehouse.manager.personId, isArchived: false },
      });
      if (srcMgr && srcMgr.id !== deletedById) {
        await tx.notification.create({
          data: {
            userId: srcMgr.id,
            title: 'Stock Returned from Reversed Transfer',
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
    oldValues: { isArchived: false, status: existing.status, quantity: existing.quantity },
    newValues: { isArchived: true, reversedQuantity: isApproved ? transferQty : 0 },
    req,
  });

  return { id: result.id, deleted: true };
}

export async function approveOrRejectTransfer(id, data, approvedById, req, user = null) {
  const existing = await prisma.warehouseStockTransfer.findFirst({
    where: { id, isArchived: false },
    include: {
      fromWarehouse: { select: { id: true, name: true } },
      toWarehouse: { select: { id: true, name: true } },
      product: { select: { id: true, name: true } },
    },
  });

  if (!existing) throw new AppError('Stock transfer not found', 404);

  // Warehouse-scoped approvers may only process transfers involving their warehouse
  await enforceTransferAccess(user, existing);

  if (existing.status && existing.status !== 'PENDING') {
    throw new AppError(
      `Stock transfer has already been ${existing.status.toLowerCase()}. No further approval action is needed.`,
      400
    );
  }

  const action = data.action || (data.status === 'APPROVED' ? 'APPROVE' : data.status === 'REJECTED' ? 'REJECT' : null);
  if (!['APPROVE', 'REJECT'].includes(action)) {
    throw new AppError('Action must be either APPROVE or REJECT', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    if (action === 'APPROVE') {
      const transferQty = Number(existing.quantity);

      // 1. Deduct the held quantity from source warehouse total (hold was on availableQty at create time)
      const sourceStock = await tx.warehouseStock.findFirst({
        where: { warehouseId: existing.fromWarehouseId, productId: existing.productId, isArchived: false },
      });
      if (!sourceStock) throw new AppError('Source warehouse stock record not found', 404);

      await tx.warehouseStock.update({
        where: { id: sourceStock.id },
        data: {
          quantity: Number(sourceStock.quantity) - transferQty,
          // availableQuantity was already reduced at create — no change needed
          updatedById: approvedById,
          updatedAt: new Date(),
        },
      });

      // 2. Credit destination warehouse — upsert-restore pattern
      // Query without isArchived: false to catch soft-deleted records and avoid unique constraint conflicts
      const destStock = await tx.warehouseStock.findFirst({
        where: { warehouseId: existing.toWarehouseId, productId: existing.productId },
      });

      if (destStock && !destStock.isArchived) {
        await tx.warehouseStock.update({
          where: { id: destStock.id },
          data: {
            quantity: Number(destStock.quantity) + transferQty,
            availableQuantity: Number(destStock.availableQuantity) + transferQty,
            updatedById: approvedById,
            updatedAt: new Date(),
          },
        });
      } else if (destStock && destStock.isArchived) {
        // Destination stock was soft-deleted/archived — restore it and credit the transferred quantity
        await tx.warehouseStock.update({
          where: { id: destStock.id },
          data: {
            quantity: transferQty,
            reservedQuantity: 0,
            availableQuantity: transferQty,
            isArchived: false,
            archivedAt: null,
            updatedById: approvedById,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.warehouseStock.create({
          data: {
            warehouseId: existing.toWarehouseId,
            productId: existing.productId,
            quantity: transferQty,
            reservedQuantity: 0,
            availableQuantity: transferQty,
            minimumStock: 0,
            reorderLevel: 0,
            createdById: approvedById,
          },
        });
      }

      // 3. Low stock alert for source warehouse after approval
      const updatedSourceQty = Number(sourceStock.quantity) - transferQty;
      const reorderLevel = Number(sourceStock.reorderLevel || 0);
      const minStock = Number(sourceStock.minimumStock || 0);
      if (
        (reorderLevel > 0 && updatedSourceQty <= reorderLevel) ||
        (minStock > 0 && updatedSourceQty <= minStock)
      ) {
        await tx.notification.create({
          data: {
            userId: approvedById,
            title: 'Low Stock Warning',
            message: `Stock for ${existing.product.name} at ${existing.fromWarehouse.name} dropped to ${updatedSourceQty} after transfer approval (Reorder level: ${reorderLevel}).`,
            type: 'INVENTORY_LOW_STOCK_WARNING',
            createdById: approvedById,
          },
        });
      }

      // 4. Update transfer record
      const updated = await tx.warehouseStockTransfer.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: approvedById,
          approvedAt: new Date(),
          rejectionReason: data.notes || null,
          updatedById: approvedById,
          updatedAt: new Date(),
        },
        include: {
          fromWarehouse: {
            select: {
              id: true,
              name: true,
              code: true,
              branch: { select: { id: true, name: true } },
            },
          },
          toWarehouse: {
            select: {
              id: true,
              name: true,
              code: true,
              branch: { select: { id: true, name: true } },
            },
          },
          product: { select: { id: true, name: true, sku: true } },
          createdBy: {
            select: {
              id: true,
              username: true,
              person: { select: { firstName: true, lastName: true } },
            },
          },
          approver: {
            select: {
              id: true,
              username: true,
              person: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      // 5. Notify the initiator
      if (existing.createdById) {
        await tx.notification.create({
          data: {
            userId: existing.createdById,
            title: 'Stock Transfer Approved & Executed',
            message: `Transfer of ${transferQty} units of ${existing.product.name} from ${existing.fromWarehouse.name} to ${existing.toWarehouse.name} was approved and stock has been moved.`,
            type: 'INVENTORY_TRANSFER_APPROVED',
            createdById: approvedById,
          },
        });
      }

      return updated;
    } else {
      // REJECT action: release the source availability hold only
      // (stock total was never moved — only availableQuantity was held at create time)
      const transferQty = Number(existing.quantity);

      const sourceStock = await tx.warehouseStock.findFirst({
        where: { warehouseId: existing.fromWarehouseId, productId: existing.productId, isArchived: false },
      });

      if (sourceStock) {
        await tx.warehouseStock.update({
          where: { id: sourceStock.id },
          data: {
            availableQuantity: Number(sourceStock.availableQuantity) + transferQty,
            updatedById: approvedById,
            updatedAt: new Date(),
          },
        });
      }

      const updated = await tx.warehouseStockTransfer.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: data.notes || data.rejectionReason || 'Rejected by manager',
          approvedBy: approvedById,
          approvedAt: new Date(),
          updatedById: approvedById,
          updatedAt: new Date(),
        },
        include: {
          fromWarehouse: {
            select: {
              id: true,
              name: true,
              code: true,
              branch: { select: { id: true, name: true } },
            },
          },
          toWarehouse: {
            select: {
              id: true,
              name: true,
              code: true,
              branch: { select: { id: true, name: true } },
            },
          },
          product: { select: { id: true, name: true, sku: true } },
          createdBy: {
            select: {
              id: true,
              username: true,
              person: { select: { firstName: true, lastName: true } },
            },
          },
          approver: {
            select: {
              id: true,
              username: true,
              person: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      if (existing.createdById) {
        await tx.notification.create({
          data: {
            userId: existing.createdById,
            title: 'Stock Transfer Rejected',
            message: `Transfer of ${transferQty} units of ${existing.product.name} was rejected and the stock hold has been released. Reason: ${data.notes || 'Not specified'}`,
            type: 'INVENTORY_TRANSFER_REJECTED',
            createdById: approvedById,
          },
        });
      }

      return updated;
    }
  });

  await logAudit({
    createdById: approvedById,
    action: action === 'APPROVE' ? 'TRANSFER_APPROVED' : 'TRANSFER_REJECTED',
    entityType: 'WarehouseStockTransfer',
    entityId: id,
    oldValues: { status: existing.status || 'PENDING' },
    newValues: { status: result.status, approvedBy: approvedById, notes: data.notes },
    req,
  });

  return sanitizeTransfer(result);
}


