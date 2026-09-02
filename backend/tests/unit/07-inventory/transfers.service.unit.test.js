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

    // Verify stock updates:
    // Source: 100 - 30 = 70
    expect(mockTx.warehouseStock.update).toHaveBeenCalledWith({
      where: { id: 'src-stock-id' },
      data: expect.objectContaining({
        quantity: 70,
        availableQuantity: 70,
      }),
    });
    // Destination: 10 + 30 = 40
    expect(mockTx.warehouseStock.update).toHaveBeenCalledWith({
      where: { id: 'dest-stock-id' },
      data: expect.objectContaining({
        quantity: 40,
        availableQuantity: 40,
      }),
    });

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
      // delta = +10: source decreases by 10 (50-10=40), destination increases by 10 (30+10=40)
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'src-stock' }, data: expect.objectContaining({ quantity: 40 }) })
      );
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'dest-stock' }, data: expect.objectContaining({ quantity: 40 }) })
      );
    });

    it('should throw 400 when reducing transfer quantity but destination lacks stock to return', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn().mockResolvedValueOnce({
            id: 'dest-stock',
            quantity: 2,
            availableQuantity: 2,
          }),
        },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      // Decrease quantity from 30 to 20 (returnQty = 10, but destination only has 2 available)
      await expect(
        updateTransfer('t-123', { quantity: 20 }, userId)
      ).rejects.toThrow('destination warehouse "Branch Warehouse" has insufficient available stock to return');
    });

    it('should successfully decrease transfer quantity and return stock to source', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn()
            .mockResolvedValueOnce({ id: 'dest-stock', quantity: 30, availableQuantity: 30 })
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
      // returnQty = 10: destination decreases by 10 (30-10=20), source increases by 10 (40+10=50)
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'dest-stock' }, data: expect.objectContaining({ quantity: 20 }) })
      );
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'src-stock' }, data: expect.objectContaining({ quantity: 50 }) })
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

    it('should throw 400 when destination warehouse lacks stock to reverse', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn().mockResolvedValueOnce({
            id: 'dest-stock',
            quantity: 10,
            availableQuantity: 10,
          }),
        },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      await expect(deleteTransfer('t-123', userId)).rejects.toThrow(
        'destination warehouse "Branch Warehouse" does not have enough available stock'
      );
    });

    it('should successfully reverse stock balances, soft-delete record, and notify managers', async () => {
      prisma.warehouseStockTransfer.findFirst.mockResolvedValueOnce(existingTransfer);
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

      // Reversal verification:
      // Destination deducted by 25: 25 - 25 = 0
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'dest-stock' }, data: expect.objectContaining({ quantity: 0 }) })
      );
      // Source incremented by 25: 50 + 25 = 75
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'src-stock' }, data: expect.objectContaining({ quantity: 75 }) })
      );
      // Soft-delete called:
      expect(mockTx.warehouseStockTransfer.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't-123' }, data: expect.objectContaining({ isArchived: true }) })
      );
      // Notification created:
      expect(mockTx.notification.create).toHaveBeenCalled();
    });
  });
});
