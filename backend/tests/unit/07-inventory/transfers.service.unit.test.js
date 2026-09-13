import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing service
vi.mock('../../../src/config/prisma.js', () => {
  return {
    default: {
      warehouse: { findFirst: vi.fn() },
      product: { findFirst: vi.fn() },
      warehouseStock: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
      productAddedQuantity: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn() },
      stockReservation: { aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }) },
      warehouseStockTransfer: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), update: vi.fn() },
      notification: { create: vi.fn() },
      user: { findFirst: vi.fn() },
      $transaction: vi.fn((callback) => callback({
        warehouseStock: {
          findFirst: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
        },
        productAddedQuantity: {
          findFirst: vi.fn(),
          create: vi.fn(),
        },
        stockReservation: {
          aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
        },
        warehouseStockTransfer: {
          create: vi.fn(),
          update: vi.fn(),
        },
        notification: {
          create: vi.fn(),
        },
        user: {
          findFirst: vi.fn(),
        },
      })),
    },
  };
});

vi.mock('../../../src/middleware/audit.middleware.js', () => ({
  logAudit: vi.fn().mockResolvedValue(true),
}));

import prisma from '../../../src/config/prisma.js';
import {
  createTransfer,
  getTransfers,
  getTransferById,
  updateTransfer,
  deleteTransfer,
  approveOrRejectTransfer,
} from '../../../src/modules/07-inventory/transfers/transfers.service.js';

describe('Stock Transfers Service (Unit)', () => {
  const fromWarehouseId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const toWarehouseId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const productId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const userId = 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when source and destination warehouse are identical', async () => {
    await expect(
      createTransfer(
        { fromWarehouseId, toWarehouseId: fromWarehouseId, productId, quantity: 10, transferReason: 'REBALANCING' },
        userId
      )
    ).rejects.toThrow('Source and destination warehouses cannot be the same');
  });

  it('should throw error when source warehouse does not exist', async () => {
    prisma.warehouse.findFirst.mockResolvedValueOnce(null);

    await expect(
      createTransfer(
        { fromWarehouseId, toWarehouseId, productId, quantity: 10, transferReason: 'REBALANCING' },
        userId
      )
    ).rejects.toThrow('Source warehouse not found');
  });

  it('should throw error when destination warehouse does not exist', async () => {
    prisma.warehouse.findFirst
      .mockResolvedValueOnce({ id: fromWarehouseId, name: 'Main Warehouse' })
      .mockResolvedValueOnce(null);

    await expect(
      createTransfer(
        { fromWarehouseId, toWarehouseId, productId, quantity: 10, transferReason: 'REBALANCING' },
        userId
      )
    ).rejects.toThrow('Destination warehouse not found');
  });

  it('should throw error when product does not exist', async () => {
    prisma.warehouse.findFirst
      .mockResolvedValueOnce({ id: fromWarehouseId, name: 'Main Warehouse' })
      .mockResolvedValueOnce({ id: toWarehouseId, name: 'Branch Warehouse' });
    prisma.product.findFirst.mockResolvedValueOnce(null);

    await expect(
      createTransfer(
        { fromWarehouseId, toWarehouseId, productId, quantity: 10, transferReason: 'REBALANCING' },
        userId
      )
    ).rejects.toThrow('Product not found');
  });

  it('should throw error when available stock in source warehouse is insufficient', async () => {
    prisma.warehouse.findFirst
      .mockResolvedValueOnce({ id: fromWarehouseId, name: 'Main Warehouse' })
      .mockResolvedValueOnce({ id: toWarehouseId, name: 'Branch Warehouse' });
    prisma.product.findFirst.mockResolvedValueOnce({ id: productId, name: 'Sugar 50kg' });

    // Available quantity is 5, requested 10
    prisma.productAddedQuantity.findFirst.mockResolvedValueOnce({
      currentTotalAvailableQty: '5',
    });
    prisma.stockReservation.aggregate.mockResolvedValueOnce({ _sum: { quantity: 0 } });

    await expect(
      createTransfer(
        { fromWarehouseId, toWarehouseId, productId, quantity: 10, transferReason: 'REBALANCING' },
        userId
      )
    ).rejects.toThrow('Insufficient available stock');
  });

  it('should successfully execute transfer, update stock balances, create movements and notifications', async () => {
    prisma.warehouse.findFirst
      .mockResolvedValueOnce({ id: fromWarehouseId, name: 'Main Warehouse', manager: { personId: 'p-mgr-1' } })
      .mockResolvedValueOnce({ id: toWarehouseId, name: 'Branch Warehouse', manager: { personId: 'p-mgr-2' } });
    prisma.product.findFirst.mockResolvedValueOnce({ id: productId, name: 'Sugar 50kg' });

    // Available stock check before transaction
    prisma.productAddedQuantity.findFirst.mockResolvedValueOnce({ currentTotalAvailableQty: 100 });
    prisma.stockReservation.aggregate.mockResolvedValueOnce({ _sum: { quantity: 0 } });

    const mockSourceStock = {
      id: 'src-stock-id',
      reorderLevel: 20,
      minimumStock: 10,
    };
    const mockTransferRecord = {
      id: 'transfer-123',
      fromWarehouseId,
      toWarehouseId,
      productId,
      quantity: 30,
      transferReason: 'REBALANCING',
      remark: 'Test transfer',
      fromWarehouse: { id: fromWarehouseId, name: 'Main Warehouse', code: 'WH-MAIN' },
      toWarehouse: { id: toWarehouseId, name: 'Branch Warehouse', code: 'WH-BRANCH' },
      product: { id: productId, name: 'Sugar 50kg', sku: 'SUG-50' },
      createdBy: { id: userId, username: 'testuser' },
    };

    const mockTx = {
      warehouseStock: {
        findFirst: vi.fn().mockResolvedValueOnce(mockSourceStock),
      },
      productAddedQuantity: {
        findFirst: vi.fn().mockResolvedValueOnce({ currentTotalAvailableQty: 100 }),
        create: vi.fn().mockResolvedValue({}),
      },
      stockReservation: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
      },
      warehouseStockTransfer: {
        create: vi.fn().mockResolvedValue(mockTransferRecord),
      },
      notification: {
        create: vi.fn().mockResolvedValue({}),
      },
      user: {
        findFirst: vi.fn()
          .mockResolvedValueOnce({ id: 'dest-mgr-user' })
          .mockResolvedValueOnce({ id: 'src-mgr-user' }),
      },
    };
    prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

    const result = await createTransfer(
      {
        fromWarehouseId,
        toWarehouseId,
        productId,
        quantity: 30,
        transferReason: 'REBALANCING',
        remark: 'Test transfer',
      },
      userId
    );

    expect(result.id).toBe('transfer-123');
    expect(result.quantity).toBe(30);

    // Stock quantity is NOT changed prior to approval
    expect(mockTx.productAddedQuantity.create).not.toHaveBeenCalled();
    expect(mockTx.notification.create).toHaveBeenCalled();
  });

  it('should get transfers with pagination', async () => {
    prisma.warehouseStockTransfer.findMany.mockResolvedValueOnce([
      { id: 't-1', quantity: 20 },
      { id: 't-2', quantity: 15 },
    ]);
    prisma.warehouseStockTransfer.count.mockResolvedValueOnce(2);

    const result = await getTransfers({ page: 1, limit: 10 });
    expect(result.transfers).toHaveLength(2);
    expect(result.transfers[0].quantity).toBe(20);
    expect(result.meta.total).toBe(2);
  });

  it('should filter transfers by productId and warehouseId', async () => {
    prisma.warehouseStockTransfer.findMany.mockResolvedValueOnce([{ id: 't-1', quantity: 20 }]);
    prisma.warehouseStockTransfer.count.mockResolvedValueOnce(1);

    const result = await getTransfers({
      warehouseId: fromWarehouseId,
      productId,
    });

    expect(result.transfers).toHaveLength(1);
    expect(prisma.warehouseStockTransfer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productId,
          OR: [
            { fromWarehouseId },
            { toWarehouseId: fromWarehouseId },
          ],
        }),
      })
    );
  });

  it('should get single transfer by ID', async () => {
    prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce({
      id: 't-1',
      quantity: 50,
      fromWarehouse: { name: 'WH1' },
      toWarehouse: { name: 'WH2' },
    });

    const result = await getTransferById('t-1');
    expect(result.id).toBe('t-1');
    expect(result.quantity).toBe(50);
  });

  it('should throw 404 when transfer is not found', async () => {
    prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(null);
    await expect(getTransferById('non-existent')).rejects.toThrow('Stock transfer not found');
  });

  describe('updateTransfer', () => {
    const existingTransfer = {
      id: 't-123',
      fromWarehouseId,
      toWarehouseId,
      productId,
      quantity: 30,
      transferReason: 'REBALANCING',
      remark: 'Original remark',
      fromWarehouse: { id: fromWarehouseId, name: 'Main Warehouse' },
      toWarehouse: { id: toWarehouseId, name: 'Branch Warehouse' },
      product: { id: productId, name: 'Sugar 50kg' },
    };

    it('should throw 404 when updating non-existent transfer', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(null);
      await expect(updateTransfer('t-missing', { remark: 'New' }, userId)).rejects.toThrow('Stock transfer not found');
    });

    it('should update metadata without stock changes when quantity is unchanged', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        warehouseStock: { update: vi.fn() },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ ...existingTransfer, remark: 'New remark' }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await updateTransfer('t-123', { remark: 'New remark' }, userId);
      expect(res.remark).toBe('New remark');
      expect(mockTx.warehouseStock.update).not.toHaveBeenCalled();
    });

    it('should throw 400 when increasing transfer quantity but source lacks available stock', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      // Top-level available check: only 5 available, need +15
      prisma.productAddedQuantity.findFirst.mockResolvedValueOnce({ currentTotalAvailableQty: 5 });
      prisma.stockReservation.aggregate.mockResolvedValueOnce({ _sum: { quantity: 0 } });

      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn().mockResolvedValueOnce({ id: 'src-stock' }),
        },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      // Increase quantity from 30 to 45 (delta = +15, but only 5 available)
      await expect(
        updateTransfer('t-123', { quantity: 45 }, userId)
      ).rejects.toThrow('Insufficient available stock');
    });

    it('should successfully increase transfer quantity when source has available stock without altering stock before approval', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      // Top-level available check: 50 available, need 40
      prisma.productAddedQuantity.findFirst.mockResolvedValueOnce({ currentTotalAvailableQty: 50 });
      prisma.stockReservation.aggregate.mockResolvedValueOnce({ _sum: { quantity: 0 } });

      const mockTx = {
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ ...existingTransfer, quantity: 40 }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await updateTransfer('t-123', { quantity: 40 }, userId);
      expect(res.quantity).toBe(40);
    });

    it('should successfully decrease transfer quantity on pending transfer without altering stock', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      prisma.productAddedQuantity.findFirst.mockResolvedValueOnce({ currentTotalAvailableQty: 50 });
      prisma.stockReservation.aggregate.mockResolvedValueOnce({ _sum: { quantity: 0 } });

      const mockTx = {
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ ...existingTransfer, quantity: 20 }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await updateTransfer('t-123', { quantity: 20 }, userId);
      expect(res.quantity).toBe(20);
    });
  });

  describe('deleteTransfer', () => {
    const existingTransfer = {
      id: 't-123',
      fromWarehouseId,
      toWarehouseId,
      productId,
      quantity: 25,
      fromWarehouse: { id: fromWarehouseId, name: 'Main Warehouse' },
      toWarehouse: { id: toWarehouseId, name: 'Branch Warehouse' },
      product: { id: productId, name: 'Sugar 50kg' },
    };

    it('should throw 404 when deleting non-existent transfer', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(null);
      await expect(deleteTransfer('t-nonexistent', userId)).rejects.toThrow('Stock transfer not found');
    });

    it('should delete a PENDING transfer without altering stock since no stock was moved before approval', async () => {
      const pendingTransfer = { ...existingTransfer, status: 'PENDING' };
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(pendingTransfer);
      const mockTx = {
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ id: 't-123', isArchived: true }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await deleteTransfer('t-123', userId);
      expect(res.deleted).toBe(true);

      expect(mockTx.warehouseStockTransfer.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't-123' }, data: expect.objectContaining({ isArchived: true }) })
      );
    });

    it('should force-reverse an APPROVED transfer even when destination stock was fully consumed (clamp to 0)', async () => {
      const approvedTransfer = { ...existingTransfer, status: 'APPROVED' };
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(approvedTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn()
            .mockResolvedValueOnce({ id: 'dest-stock', isArchived: false })
            .mockResolvedValueOnce({ id: 'src-stock', isArchived: false }),
        },
        productAddedQuantity: {
          findFirst: vi.fn()
            // dest has 0 available/total
            .mockResolvedValueOnce({ currentTotalAvailableQty: 0 })
            // src has 20
            .mockResolvedValueOnce({ currentTotalAvailableQty: 20 }),
          create: vi.fn().mockResolvedValue({}),
        },
        stockReservation: {
          aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ id: 't-123', isArchived: true }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await deleteTransfer('t-123', userId);
      expect(res.deleted).toBe(true);

      // Destination deducted by min(0, 25) = 0
      expect(mockTx.productAddedQuantity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            addedQuantity: -0,
            referenceType: 'TRANSFER_REVERSAL',
          }),
        })
      );
      // Source restored by 25
      expect(mockTx.productAddedQuantity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            addedQuantity: 25,
            currentTotalAvailableQty: 45,
            referenceType: 'TRANSFER_REVERSAL',
          }),
        })
      );
    });

    it('should fully reverse stock when deleting an APPROVED transfer (normal case)', async () => {
      const approvedTransfer = { ...existingTransfer, status: 'APPROVED' };
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(approvedTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn()
            .mockResolvedValueOnce({ id: 'dest-stock', isArchived: false })
            .mockResolvedValueOnce({ id: 'src-stock', isArchived: false }),
        },
        productAddedQuantity: {
          findFirst: vi.fn()
            .mockResolvedValueOnce({ currentTotalAvailableQty: 25 })
            .mockResolvedValueOnce({ currentTotalAvailableQty: 50 }),
          create: vi.fn().mockResolvedValue({}),
        },
        stockReservation: {
          aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ id: 't-123', isArchived: true }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await deleteTransfer('t-123', userId);
      expect(res.deleted).toBe(true);

      // Destination deducted by 25
      expect(mockTx.productAddedQuantity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            addedQuantity: -25,
            currentTotalAvailableQty: 0,
            referenceType: 'TRANSFER_REVERSAL',
          }),
        })
      );
      // Source restored by 25 (50 + 25 = 75)
      expect(mockTx.productAddedQuantity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            addedQuantity: 25,
            currentTotalAvailableQty: 75,
            referenceType: 'TRANSFER_REVERSAL',
          }),
        })
      );
      expect(mockTx.warehouseStockTransfer.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't-123' }, data: expect.objectContaining({ isArchived: true }) })
      );
      expect(mockTx.notification.create).toHaveBeenCalled();
    });
  });

  describe('approveOrRejectTransfer', () => {
    const existingTransfer = {
      id: 't-123',
      fromWarehouseId,
      toWarehouseId,
      productId,
      quantity: 15,
      status: 'PENDING',
      createdById: userId,
      fromWarehouse: { id: fromWarehouseId, name: 'Main Warehouse' },
      toWarehouse: { id: toWarehouseId, name: 'Branch Warehouse' },
      product: { id: productId, name: 'Sugar 50kg' },
    };

    it('should throw 400 when transfer is already approved', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce({
        ...existingTransfer,
        status: 'APPROVED',
      });
      await expect(
        approveOrRejectTransfer('t-123', { action: 'APPROVE' }, userId)
      ).rejects.toThrow('Stock transfer has already been approved');
    });

    it('should successfully approve transfer, deduct source warehouse stock and credit destination stock', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn()
            .mockResolvedValueOnce({ id: 'src-stock', reorderLevel: 5, minimumStock: 2 })
            .mockResolvedValueOnce({ id: 'dest-stock', isArchived: false }),
          update: vi.fn().mockResolvedValue({}),
        },
        productAddedQuantity: {
          findFirst: vi.fn()
            .mockResolvedValueOnce({ currentTotalAvailableQty: 50 })
            .mockResolvedValueOnce({ currentTotalAvailableQty: 50 })
            .mockResolvedValueOnce({ currentTotalAvailableQty: 10 })
            .mockResolvedValueOnce({ currentTotalAvailableQty: 35 }),
          create: vi.fn().mockResolvedValue({}),
        },
        stockReservation: {
          aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ ...existingTransfer, status: 'APPROVED' }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await approveOrRejectTransfer('t-123', { action: 'APPROVE' }, userId);
      expect(res.status).toBe('APPROVED');

      // Source stock deducted: 50 - 15 = 35
      expect(mockTx.productAddedQuantity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            warehouseStockId: 'src-stock',
            addedQuantity: -15,
            previousTotalQty: 50,
            currentTotalAvailableQty: 35,
            referenceType: 'TRANSFER',
          }),
        })
      );

      // Destination stock credited: 10 + 15 = 25
      expect(mockTx.productAddedQuantity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            warehouseStockId: 'dest-stock',
            addedQuantity: 15,
            previousTotalQty: 10,
            currentTotalAvailableQty: 25,
            referenceType: 'TRANSFER',
          }),
        })
      );
    });

    it('should throw 400 when source warehouse has insufficient stock at approval time', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        productAddedQuantity: {
          findFirst: vi.fn().mockResolvedValueOnce({ currentTotalAvailableQty: 5 }),
        },
        stockReservation: {
          aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
        },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      await expect(
        approveOrRejectTransfer('t-123', { action: 'APPROVE' }, userId)
      ).rejects.toThrow('Insufficient available stock');
    });

    it('should restore archived destination stock when approving transfer', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn()
            .mockResolvedValueOnce({ id: 'src-stock', reorderLevel: 5, minimumStock: 2 })
            .mockResolvedValueOnce({ id: 'dest-stock-archived', isArchived: true }),
          update: vi.fn().mockResolvedValue({ id: 'dest-stock-archived', isArchived: false }),
        },
        productAddedQuantity: {
          findFirst: vi.fn()
            .mockResolvedValueOnce({ currentTotalAvailableQty: 50 })
            .mockResolvedValueOnce({ currentTotalAvailableQty: 50 })
            .mockResolvedValueOnce({ currentTotalAvailableQty: 0 })
            .mockResolvedValueOnce({ currentTotalAvailableQty: 35 }),
          create: vi.fn().mockResolvedValue({}),
        },
        stockReservation: {
          aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ ...existingTransfer, status: 'APPROVED' }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await approveOrRejectTransfer('t-123', { action: 'APPROVE' }, userId);
      expect(res.status).toBe('APPROVED');

      // Un-archive destination stock record
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dest-stock-archived' },
          data: expect.objectContaining({ isArchived: false }),
        })
      );

      // Source stock deducted
      expect(mockTx.productAddedQuantity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            warehouseStockId: 'src-stock',
            addedQuantity: -15,
            referenceType: 'TRANSFER',
          }),
        })
      );

      // Destination stock credited via ProductAddedQuantity
      expect(mockTx.productAddedQuantity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            warehouseStockId: 'dest-stock-archived',
            addedQuantity: 15,
            referenceType: 'TRANSFER',
          }),
        })
      );
    });

    it('should mark transfer as REJECTED without modifying stock when rejecting a transfer', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        productAddedQuantity: { create: vi.fn() },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ ...existingTransfer, status: 'REJECTED' }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await approveOrRejectTransfer('t-123', { action: 'REJECT', notes: 'Damaged packaging' }, userId);
      expect(res.status).toBe('REJECTED');

      // No stock modification on rejection
      expect(mockTx.productAddedQuantity.create).not.toHaveBeenCalled();
      expect(mockTx.warehouseStockTransfer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 't-123' },
          data: expect.objectContaining({
            status: 'REJECTED',
            rejectionReason: 'Damaged packaging',
          }),
        })
      );
    });
  });
});
