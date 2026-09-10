import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing service
vi.mock('../../../src/config/prisma.js', () => {
  return {
    default: {
      warehouse: { findFirst: vi.fn() },
      product: { findFirst: vi.fn() },
      warehouseStock: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
      warehouseStockTransfer: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
      notification: { create: vi.fn() },
      user: { findFirst: vi.fn() },
      $transaction: vi.fn((callback) => callback({
        warehouseStock: {
          findFirst: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
        },
        warehouseStockTransfer: {
          create: vi.fn(),
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

    const mockTx = {
      warehouseStock: {
        findFirst: vi.fn().mockResolvedValueOnce({
          id: 'stock-1',
          quantity: '5',
          availableQuantity: '5',
        }),
      },
    };
    prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

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

    const mockSourceStock = {
      id: 'src-stock-id',
      quantity: 100,
      availableQuantity: 100,
      reorderLevel: 20,
      minimumStock: 10,
    };
    const mockDestStock = {
      id: 'dest-stock-id',
      quantity: 10,
      availableQuantity: 10,
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
        findFirst: vi.fn()
          .mockResolvedValueOnce(mockSourceStock)
          .mockResolvedValueOnce(mockDestStock),
        update: vi.fn().mockResolvedValue({}),
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

    // New behaviour: create only holds (reserves) source availableQuantity
    // Total quantity on source is NOT changed until approval.
    // No destination stock change at create time.
    expect(mockTx.warehouseStock.update).toHaveBeenCalledWith({
      where: { id: 'src-stock-id' },
      data: expect.objectContaining({
        // Source availableQuantity reduced by 30: 100 - 30 = 70
        availableQuantity: 70,
      }),
    });
    // Destination is NOT touched at create time
    expect(mockTx.warehouseStock.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'dest-stock-id' } })
    );

    // Verify notifications (creator, destination manager, source manager):
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
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn().mockResolvedValueOnce({
            id: 'src-stock',
            quantity: 5,
            availableQuantity: 5,
          }),
        },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      // Increase quantity from 30 to 45 (delta = +15, but only 5 available)
      await expect(
        updateTransfer('t-123', { quantity: 45 }, userId)
      ).rejects.toThrow('Insufficient available stock');
    });

    it('should successfully increase transfer quantity when source has available stock', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn()
            .mockResolvedValueOnce({ id: 'src-stock', quantity: 50, availableQuantity: 50 })
            .mockResolvedValueOnce({ id: 'dest-stock', quantity: 30, availableQuantity: 30 }),
          update: vi.fn().mockResolvedValue({}),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ ...existingTransfer, quantity: 40 }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await updateTransfer('t-123', { quantity: 40 }, userId);
      expect(res.quantity).toBe(40);
      // New behaviour: only source availableQuantity hold is extended by delta (+10)
      // Source hold: 50 available - 10 delta = 40
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'src-stock' }, data: expect.objectContaining({ availableQuantity: 40 }) })
      );
      // Destination is NOT touched until approval
      expect(mockTx.warehouseStock.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'dest-stock' } })
      );
    });

    it('should release partial hold back to source when reducing transfer quantity (PENDING)', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn()
            .mockResolvedValueOnce({ id: 'src-stock', quantity: 50, availableQuantity: 30 }),
          update: vi.fn().mockResolvedValue({}),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ ...existingTransfer, quantity: 20 }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      // Decrease quantity from 30 to 20 (releaseQty = 10 back to source)
      await expect(
        updateTransfer('t-123', { quantity: 20 }, userId)
      ).resolves.toBeDefined();
    });


    it('should successfully decrease transfer quantity and return stock to source', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        warehouseStock: {
          // New behaviour: only source stock is looked up when reducing a PENDING transfer
          findFirst: vi.fn()
            .mockResolvedValueOnce({ id: 'src-stock', quantity: 40, availableQuantity: 40 }),
          update: vi.fn().mockResolvedValue({}),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ ...existingTransfer, quantity: 20 }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await updateTransfer('t-123', { quantity: 20 }, userId);
      expect(res.quantity).toBe(20);
      // New behaviour: releaseQty = 10 is returned to source availableQuantity (hold released)
      // Source: 40 available + 10 released = 50
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'src-stock' }, data: expect.objectContaining({ availableQuantity: 50 }) })
      );
      // Destination is not touched (no stock moved yet)
      expect(mockTx.warehouseStock.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'dest-stock' } })
      );
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

    it('should release the source hold when deleting a PENDING transfer (no stock moved)', async () => {
      const pendingTransfer = { ...existingTransfer, status: 'PENDING' };
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(pendingTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn().mockResolvedValueOnce({
            id: 'src-stock',
            quantity: 50,
            availableQuantity: 25,
            isArchived: false,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ id: 't-123', isArchived: true }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await deleteTransfer('t-123', userId);
      expect(res.deleted).toBe(true);

      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'src-stock' }, data: expect.objectContaining({ availableQuantity: 50 }) })
      );
      expect(mockTx.warehouseStockTransfer.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't-123' }, data: expect.objectContaining({ isArchived: true }) })
      );
    });

    it('should force-reverse an APPROVED transfer even when destination stock was fully consumed (clamp to 0)', async () => {
      // Destination has 0 available (stock was consumed) but quantity still shows 30
      const approvedTransfer = { ...existingTransfer, status: 'APPROVED' };
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(approvedTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn()
            // dest stock: 30 quantity but 0 available (all consumed/reserved)
            .mockResolvedValueOnce({ id: 'dest-stock', quantity: 30, availableQuantity: 0, isArchived: false })
            // source stock: active, restore here
            .mockResolvedValueOnce({ id: 'src-stock', quantity: 20, availableQuantity: 20, isArchived: false }),
          update: vi.fn().mockResolvedValue({}),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ id: 't-123', isArchived: true }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await deleteTransfer('t-123', userId);
      expect(res.deleted).toBe(true);

      // Destination: quantity 30-25=5 clamped... actually 30-25=5, availQty clamped 0-0=0
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dest-stock' },
          data: expect.objectContaining({ quantity: 5, availableQuantity: 0 }),
        })
      );
      // Source: quantity 20+25=45, availableQuantity 20+25=45
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'src-stock' },
          data: expect.objectContaining({ quantity: 45 }),
        })
      );
    });

    it('should fully reverse stock when deleting an APPROVED transfer (normal case)', async () => {
      const approvedTransfer = { ...existingTransfer, status: 'APPROVED' };
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(approvedTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn()
            .mockResolvedValueOnce({ id: 'dest-stock', quantity: 25, availableQuantity: 25 })
            .mockResolvedValueOnce({ id: 'src-stock', quantity: 50, availableQuantity: 50 }),
          update: vi.fn().mockResolvedValue({}),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ id: 't-123', isArchived: true }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await deleteTransfer('t-123', userId);
      expect(res.deleted).toBe(true);

      // Full reversal: destination deducted by 25 (25-25=0), source restored by 25 (50+25=75)
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'dest-stock' }, data: expect.objectContaining({ quantity: 0 }) })
      );
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'src-stock' }, data: expect.objectContaining({ quantity: 75 }) })
      );
      // Soft-delete called:
      expect(mockTx.warehouseStockTransfer.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't-123' }, data: expect.objectContaining({ isArchived: true }) })
      );
      // Notifications dispatched:
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

    it('should successfully approve transfer and credit active destination stock', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn()
            // source stock: deduct total quantity
            .mockResolvedValueOnce({ id: 'src-stock', quantity: 50, availableQuantity: 35, reorderLevel: 5 })
            // dest stock: active, credit quantity & availableQuantity
            .mockResolvedValueOnce({ id: 'dest-stock', quantity: 10, availableQuantity: 10, isArchived: false }),
          update: vi.fn().mockResolvedValue({}),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ ...existingTransfer, status: 'APPROVED' }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await approveOrRejectTransfer('t-123', { action: 'APPROVE' }, userId);
      expect(res.status).toBe('APPROVED');

      // Source stock: 50 - 15 = 35 total quantity
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'src-stock' },
          data: expect.objectContaining({ quantity: 35 }),
        })
      );

      // Destination stock: 10 + 15 = 25
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dest-stock' },
          data: expect.objectContaining({ quantity: 25, availableQuantity: 25 }),
        })
      );
    });

    it('should restore archived destination stock when approving transfer', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn()
            // source stock
            .mockResolvedValueOnce({ id: 'src-stock', quantity: 50, availableQuantity: 35, reorderLevel: 5 })
            // dest stock: soft-deleted/archived previously
            .mockResolvedValueOnce({ id: 'dest-stock-archived', quantity: 0, availableQuantity: 0, isArchived: true }),
          update: vi.fn().mockResolvedValue({}),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ ...existingTransfer, status: 'APPROVED' }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await approveOrRejectTransfer('t-123', { action: 'APPROVE' }, userId);
      expect(res.status).toBe('APPROVED');

      // Destination stock should be restored with un-archive flags and transfer quantity
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dest-stock-archived' },
          data: expect.objectContaining({
            quantity: 15,
            availableQuantity: 15,
            isArchived: false,
            archivedAt: null,
          }),
        })
      );
    });

    it('should release source hold when rejecting a transfer', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn().mockResolvedValueOnce({
            id: 'src-stock',
            quantity: 50,
            availableQuantity: 35,
            isArchived: false,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        warehouseStockTransfer: {
          update: vi.fn().mockResolvedValue({ ...existingTransfer, status: 'REJECTED' }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await approveOrRejectTransfer('t-123', { action: 'REJECT', notes: 'Damaged packaging' }, userId);
      expect(res.status).toBe('REJECTED');

      // Source available quantity restored: 35 + 15 = 50
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'src-stock' },
          data: expect.objectContaining({ availableQuantity: 50 }),
        })
      );
    });
  });
});
