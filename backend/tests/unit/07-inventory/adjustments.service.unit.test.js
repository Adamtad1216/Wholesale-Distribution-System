import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing service
vi.mock('../../../src/config/prisma.js', () => {
  return {
    default: {
      warehouse: { findFirst: vi.fn() },
      product: { findFirst: vi.fn() },
      warehouseStock: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
      stockAdjustment: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), update: vi.fn() },
      stockAdjustmentItem: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
      notification: { create: vi.fn() },
      $transaction: vi.fn((callback) => callback({
        stockAdjustment: {
          create: vi.fn(),
          update: vi.fn(),
          findFirst: vi.fn(),
        },
        warehouseStock: {
          findFirst: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
        },
        stockAdjustmentItem: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
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
  createAdjustment,
  approveAdjustment,
} from '../../../src/modules/07-inventory/adjustments/adjustments.service.js';
import { requirePermission } from '../../../src/middleware/permission.middleware.js';

describe('Stock Adjustment Service & Permission Tests', () => {
  const warehouseId = 'w0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const productId = 'p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const userId = 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAdjustment - systemQuantity and difference calculation', () => {
    it('should compute systemQuantity and difference based on existing warehouseStock', async () => {
      prisma.warehouse.findFirst.mockResolvedValueOnce({ id: warehouseId, name: 'Central Warehouse' });
      prisma.product.findFirst.mockResolvedValueOnce({ id: productId, name: 'Sugar 50kg' });

      // Existing warehouse stock has 50 units
      prisma.warehouseStock.findFirst.mockResolvedValueOnce({
        id: 'stock-1',
        quantity: '50.000',
      });

      const mockAdjustmentRecord = {
        id: 'adj-1',
        warehouseId,
        reason: 'Annual inventory count',
        status: 'PENDING',
        items: [
          {
            id: 'item-1',
            productId,
            systemQuantity: 50,
            actualQuantity: 45, // Shrinkage of 5
            difference: -5,
          },
        ],
      };

      const mockTx = {
        stockAdjustment: {
          create: vi.fn().mockResolvedValueOnce(mockAdjustmentRecord),
        },
        notification: {
          create: vi.fn().mockResolvedValue({}),
        },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const result = await createAdjustment(
        {
          warehouseId,
          reason: 'Annual inventory count',
          items: [{ productId, actualQuantity: 45, reason: 'Damaged packaging' }],
        },
        userId
      );

      expect(result.id).toBe('adj-1');
      // Verify that create received systemQuantity: 50 and difference: -5
      expect(mockTx.stockAdjustment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: {
              create: [
                expect.objectContaining({
                  productId,
                  systemQuantity: 50,
                  actualQuantity: 45,
                  difference: -5,
                }),
              ],
            },
          }),
        })
      );
    });

    it('should assume systemQuantity: 0 and difference = actualQuantity when stock record does not exist', async () => {
      prisma.warehouse.findFirst.mockResolvedValueOnce({ id: warehouseId, name: 'Central Warehouse' });
      prisma.product.findFirst.mockResolvedValueOnce({ id: productId, name: 'Sugar 50kg' });

      // No stock record exists yet
      prisma.warehouseStock.findFirst.mockResolvedValueOnce(null);

      const mockAdjustmentRecord = {
        id: 'adj-2',
        warehouseId,
        items: [{ id: 'item-2', productId, systemQuantity: 0, actualQuantity: 20, difference: 20 }],
      };

      const mockTx = {
        stockAdjustment: {
          create: vi.fn().mockResolvedValueOnce(mockAdjustmentRecord),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      await createAdjustment(
        {
          warehouseId,
          reason: 'Found extra inventory',
          items: [{ productId, actualQuantity: 20 }],
        },
        userId
      );

      expect(mockTx.stockAdjustment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: {
              create: [
                expect.objectContaining({
                  productId,
                  systemQuantity: 0,
                  actualQuantity: 20,
                  difference: 20,
                }),
              ],
            },
          }),
        })
      );
    });
  });

  describe('approveAdjustment - WarehouseStock quantity updates based on difference', () => {
    it('should decrease warehouse stock when difference is negative (shrinkage/loss)', async () => {
      const existingAdjustment = {
        id: 'adj-10',
        warehouseId,
        status: 'PENDING',
        warehouse: { name: 'Main Hub' },
      };
      prisma.stockAdjustment.findFirst.mockResolvedValueOnce(existingAdjustment);

      const updatedAdjustment = {
        ...existingAdjustment,
        status: 'APPROVED',
        items: [
          {
            productId,
            systemQuantity: 100,
            actualQuantity: 92,
            difference: -8, // 8 units less
          },
        ],
      };

      const mockStock = {
        id: 'stock-main',
        warehouseId,
        productId,
        quantity: 100,
        reservedQuantity: 10,
        availableQuantity: 90,
      };

      const mockTx = {
        stockAdjustment: {
          update: vi.fn().mockResolvedValue(updatedAdjustment),
        },
        warehouseStock: {
          findFirst: vi.fn().mockResolvedValueOnce(mockStock),
          update: vi.fn().mockResolvedValue({}),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      const result = await approveAdjustment('adj-10', { status: 'APPROVED' }, userId);

      expect(result.status).toBe('APPROVED');
      // Stock quantity: 100 + (-8) = 92
      // Available: 92 - 10 = 82
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith({
        where: { id: 'stock-main' },
        data: expect.objectContaining({
          quantity: 92,
          availableQuantity: 82,
        }),
      });
    });

    it('should increase warehouse stock when difference is positive (surplus found)', async () => {
      const existingAdjustment = {
        id: 'adj-11',
        warehouseId,
        status: 'PENDING',
        warehouse: { name: 'Main Hub' },
      };
      prisma.stockAdjustment.findFirst.mockResolvedValueOnce(existingAdjustment);

      const updatedAdjustment = {
        ...existingAdjustment,
        status: 'APPROVED',
        items: [
          {
            productId,
            systemQuantity: 50,
            actualQuantity: 65,
            difference: 15, // 15 units more
          },
        ],
      };

      const mockStock = {
        id: 'stock-main',
        warehouseId,
        productId,
        quantity: 50,
        reservedQuantity: 0,
        availableQuantity: 50,
      };

      const mockTx = {
        stockAdjustment: {
          update: vi.fn().mockResolvedValue(updatedAdjustment),
        },
        warehouseStock: {
          findFirst: vi.fn().mockResolvedValueOnce(mockStock),
          update: vi.fn().mockResolvedValue({}),
        },
        notification: { create: vi.fn() },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      await approveAdjustment('adj-11', { status: 'APPROVED' }, userId);

      // Stock quantity: 50 + 15 = 65
      expect(mockTx.warehouseStock.update).toHaveBeenCalledWith({
        where: { id: 'stock-main' },
        data: expect.objectContaining({
          quantity: 65,
          availableQuantity: 65,
        }),
      });
    });

    it('should throw error if negative difference would cause stock to drop below zero', async () => {
      const existingAdjustment = {
        id: 'adj-12',
        warehouseId,
        status: 'PENDING',
        warehouse: { name: 'Main Hub' },
      };
      prisma.stockAdjustment.findFirst.mockResolvedValueOnce(existingAdjustment);

      const updatedAdjustment = {
        ...existingAdjustment,
        status: 'APPROVED',
        items: [
          {
            productId,
            systemQuantity: 10,
            actualQuantity: -5,
            difference: -20, // Difference of -20 on stock of 10
          },
        ],
      };

      const mockStock = {
        id: 'stock-main',
        warehouseId,
        productId,
        quantity: 10,
        reservedQuantity: 0,
        availableQuantity: 10,
      };

      const mockTx = {
        stockAdjustment: {
          update: vi.fn().mockResolvedValue(updatedAdjustment),
        },
        warehouseStock: {
          findFirst: vi.fn().mockResolvedValueOnce(mockStock),
        },
      };
      prisma.$transaction.mockImplementationOnce((cb) => cb(mockTx));

      await expect(
        approveAdjustment('adj-12', { status: 'APPROVED' }, userId)
      ).rejects.toThrow('Stock adjustment would cause negative inventory');
    });
  });

  describe('Permission Enforcement for Adjustments', () => {
    it('should allow user with inventory:adjustments:approve permission', () => {
      const middleware = requirePermission('inventory:adjustments:approve');
      const req = {
        user: {
          id: userId,
          userRoles: [
            {
              role: {
                rolePermissions: [
                  { permission: { name: 'inventory:adjustments:read' } },
                  { permission: { name: 'inventory:adjustments:approve' } },
                ],
              },
            },
          ],
        },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject user lacking inventory:adjustments:approve permission (e.g. WAREHOUSE_OPERATOR)', () => {
      const middleware = requirePermission('inventory:adjustments:approve');
      const req = {
        user: {
          id: userId,
          userRoles: [
            {
              role: {
                name: 'WAREHOUSE_OPERATOR',
                rolePermissions: [
                  { permission: { name: 'inventory:adjustments:create' } },
                  { permission: { name: 'inventory:adjustments:read' } },
                  { permission: { name: 'inventory:adjustments:update' } },
                ],
              },
            },
          ],
        },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Insufficient permissions',
        })
      );
    });

    it('should require authentication (401 when req.user is absent)', () => {
      const middleware = requirePermission('inventory:adjustments:approve');
      const req = {};
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
