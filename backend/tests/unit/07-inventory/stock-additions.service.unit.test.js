import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../src/config/prisma.js', () => {
  return {
    default: {
      warehouse: { findFirst: vi.fn() },
      product: { findFirst: vi.fn() },
      warehouseStock: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
      productAddedQuantity: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
      stockReservation: { aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }) },
      notification: { create: vi.fn() },
      $transaction: vi.fn((callback) => callback({
        warehouseStock: {
          findFirst: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
        },
        productAddedQuantity: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
        stockReservation: {
          aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
        },
        notification: {
          create: vi.fn(),
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
  createStockAddition,
  getStockAdditions,
  getStockAdditionById,
  updateStockAddition,
  deleteStockAddition,
  getStockQuantitySummary,
} from '../../../src/modules/07-inventory/stock-additions/stock-additions.service.js';

describe('Stock Additions Service (Unit)', () => {
  const warehouseId = 'w0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const productId = 'p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const userId = 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStockQuantitySummary', () => {
    it('should return 0 when no additions exist', async () => {
      prisma.productAddedQuantity.findFirst.mockResolvedValueOnce(null);
      prisma.stockReservation.aggregate.mockResolvedValueOnce({ _sum: { quantity: 0 } });

      const summary = await getStockQuantitySummary(warehouseId, productId);
      expect(summary.quantity).toBe(0);
      expect(summary.reservedQuantity).toBe(0);
      expect(summary.availableQuantity).toBe(0);
    });

    it('should calculate quantity and subtract reserved quantity from available', async () => {
      prisma.productAddedQuantity.findFirst.mockResolvedValueOnce({
        currentTotalAvailableQty: 100,
      });
      prisma.stockReservation.aggregate.mockResolvedValueOnce({ _sum: { quantity: 25 } });

      const summary = await getStockQuantitySummary(warehouseId, productId);
      expect(summary.quantity).toBe(100);
      expect(summary.reservedQuantity).toBe(25);
      expect(summary.availableQuantity).toBe(75);
    });
  });

  describe('createStockAddition', () => {
    it('should throw 404 when warehouse does not exist', async () => {
      prisma.warehouse.findFirst.mockResolvedValueOnce(null);

      await expect(
        createStockAddition({ warehouseId, productId, addedQuantity: 50 }, userId)
      ).rejects.toThrow('Warehouse not found');
    });

    it('should throw 404 when product does not exist', async () => {
      prisma.warehouse.findFirst.mockResolvedValueOnce({ id: warehouseId, name: 'Main Hub' });
      prisma.product.findFirst.mockResolvedValueOnce(null);

      await expect(
        createStockAddition({ warehouseId, productId, addedQuantity: 50 }, userId)
      ).rejects.toThrow('Product not found');
    });

    it('should successfully create addition and stock record if none exists', async () => {
      prisma.warehouse.findFirst.mockResolvedValueOnce({ id: warehouseId, name: 'Main Hub' });
      prisma.product.findFirst.mockResolvedValueOnce({ id: productId, name: 'Wheat Flour' });

      const mockStock = { id: 'ws-1', warehouseId, productId };
      const mockAddition = {
        id: 'paq-1',
        warehouseStockId: 'ws-1',
        warehouseId,
        productId,
        previousTotalQty: 0,
        addedQuantity: 50,
        currentTotalAvailableQty: 50,
        referenceType: 'MANUAL_INTAKE',
        warehouse: { id: warehouseId, name: 'Main Hub' },
        product: { id: productId, name: 'Wheat Flour' },
      };

      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn().mockResolvedValueOnce(null),
          create: vi.fn().mockResolvedValueOnce(mockStock),
        },
        productAddedQuantity: {
          findFirst: vi.fn().mockResolvedValueOnce(null),
          create: vi.fn().mockResolvedValueOnce(mockAddition),
        },
        stockReservation: {
          aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const result = await createStockAddition(
        { warehouseId, productId, addedQuantity: 50, referenceType: 'MANUAL_INTAKE' },
        userId
      );

      expect(result.id).toBe('paq-1');
      expect(result.addedQuantity).toBe(50);
      expect(result.currentTotalAvailableQty).toBe(50);

      expect(mockTx.warehouseStock.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ warehouseId, productId }),
      });
      expect(mockTx.productAddedQuantity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          warehouseStockId: 'ws-1',
          warehouseId,
          productId,
          previousTotalQty: 0,
          addedQuantity: 50,
          currentTotalAvailableQty: 50,
          referenceType: 'MANUAL_INTAKE',
        }),
        include: expect.any(Object),
      });
      expect(mockTx.notification.create).toHaveBeenCalled();
    });

    it('should correctly increment previous total quantity when stock already exists', async () => {
      prisma.warehouse.findFirst.mockResolvedValueOnce({ id: warehouseId, name: 'Main Hub' });
      prisma.product.findFirst.mockResolvedValueOnce({ id: productId, name: 'Wheat Flour' });

      const mockStock = { id: 'ws-1', warehouseId, productId, isArchived: false };
      const mockAddition = {
        id: 'paq-2',
        warehouseStockId: 'ws-1',
        warehouseId,
        productId,
        previousTotalQty: 50,
        addedQuantity: 30,
        currentTotalAvailableQty: 80,
        referenceType: 'PURCHASE_RECEIPT',
      };

      const mockTx = {
        warehouseStock: {
          findFirst: vi.fn().mockResolvedValueOnce(mockStock),
        },
        productAddedQuantity: {
          findFirst: vi.fn().mockResolvedValueOnce({ currentTotalAvailableQty: 50 }),
          create: vi.fn().mockResolvedValueOnce(mockAddition),
        },
        stockReservation: {
          aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const result = await createStockAddition(
        { warehouseId, productId, addedQuantity: 30, referenceType: 'PURCHASE_RECEIPT' },
        userId
      );

      expect(result.id).toBe('paq-2');
      expect(result.previousTotalQty).toBe(50);
      expect(result.addedQuantity).toBe(30);
      expect(result.currentTotalAvailableQty).toBe(80);
    });
  });

  describe('getStockAdditions', () => {
    it('should return paginated stock additions', async () => {
      const mockAdditions = [
        { id: 'paq-1', addedQuantity: 20, previousTotalQty: 0, currentTotalAvailableQty: 20 },
        { id: 'paq-2', addedQuantity: 10, previousTotalQty: 20, currentTotalAvailableQty: 30 },
      ];
      prisma.productAddedQuantity.findMany.mockResolvedValueOnce(mockAdditions);
      prisma.productAddedQuantity.count.mockResolvedValueOnce(2);

      const res = await getStockAdditions({ page: 1, limit: 10 });
      expect(res.additions).toHaveLength(2);
      expect(res.meta.total).toBe(2);
    });
  });

  describe('getStockAdditionById', () => {
    it('should throw 404 when addition not found', async () => {
      prisma.productAddedQuantity.findFirst.mockResolvedValueOnce(null);
      await expect(getStockAdditionById('missing-id')).rejects.toThrow('Stock addition not found');
    });

    it('should return sanitized addition record', async () => {
      prisma.productAddedQuantity.findFirst.mockResolvedValueOnce({
        id: 'paq-1',
        warehouseId,
        productId,
        addedQuantity: 100,
        previousTotalQty: 50,
        currentTotalAvailableQty: 150,
      });

      const res = await getStockAdditionById('paq-1');
      expect(res.id).toBe('paq-1');
      expect(res.addedQuantity).toBe(100);
      expect(res.currentTotalAvailableQty).toBe(150);
    });
  });

  describe('deleteStockAddition', () => {
    it('should soft-delete addition and rebalance subsequent records', async () => {
      const existing = {
        id: 'paq-1',
        warehouseId,
        productId,
        addedQuantity: 30,
        createdAt: new Date('2026-01-01'),
        product: { name: 'Wheat Flour' },
        warehouse: { name: 'Main Hub' },
      };
      prisma.productAddedQuantity.findFirst.mockResolvedValueOnce(existing);
      prisma.productAddedQuantity.findMany.mockResolvedValueOnce([]);

      const mockTx = {
        productAddedQuantity: {
          update: vi.fn().mockResolvedValue({ id: 'paq-1', isArchived: true }),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const res = await deleteStockAddition('paq-1', userId);
      expect(res.deleted).toBe(true);
      expect(mockTx.productAddedQuantity.update).toHaveBeenCalledWith({
        where: { id: 'paq-1' },
        data: expect.objectContaining({ isArchived: true }),
      });
    });
  });
});
