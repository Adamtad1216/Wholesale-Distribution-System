import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/config/prisma.js', () => ({
  default: {
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    warehouse: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../../src/middleware/audit.middleware.js', () => ({
  logAudit: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../src/modules/14-notifications/notifications/notifications.service.js', () => ({
  createNotification: vi.fn().mockResolvedValue(true),
}));

import prisma from '../../../src/config/prisma.js';
import {
  generateProductCode,
  ensureUniqueSku,
  getProducts,
} from '../../../src/modules/05-product-catalog/products/products.service.js';

describe('Products Service Helpers (Unit)', () => {
  it('generateProductCode should generate code starting with PRD-', () => {
    const code = generateProductCode();
    expect(code).toMatch(/^PRD-[A-Z0-9]+-[A-Z0-9]+$/);
  });

  it('ensureUniqueSku should return original SKU if no collision', async () => {
    const mockTx = {
      product: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };

    const sku = await ensureUniqueSku(mockTx, 'MY-UNIQUE-SKU');
    expect(sku).toBe('MY-UNIQUE-SKU');
  });

  it('ensureUniqueSku should append random suffix if collision exists', async () => {
    const mockTx = {
      product: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ id: 'existing-id', sku: 'COLLIDING-SKU' })
          .mockResolvedValueOnce(null),
      },
    };

    const sku = await ensureUniqueSku(mockTx, 'COLLIDING-SKU');
    expect(sku).toContain('COLLIDING-SKU-');
    expect(mockTx.product.findFirst).toHaveBeenCalledTimes(2);
  });
});

describe('getProducts Warehouse Scoping & Filtering (Unit)', () => {
  const warehouseId = '123e4567-e89b-12d3-a456-426614174001';
  const personId = '123e4567-e89b-12d3-a456-426614174002';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter products linked via warehouseStocks OR warehouseSellingPrices when warehouseId is given', async () => {
    prisma.product.findMany.mockResolvedValueOnce([]);
    prisma.product.count.mockResolvedValueOnce(0);

    await getProducts({ warehouseId });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            {
              OR: [
                {
                  warehouseStocks: {
                    some: {
                      warehouseId,
                      isArchived: false,
                    },
                  },
                },
                {
                  warehouseSellingPrices: {
                    some: {
                      warehouseId,
                      isArchived: false,
                    },
                  },
                },
              ],
            },
          ]),
        }),
      })
    );
  });

  it('should auto-scope products to assigned warehouse when a non-admin warehouse manager calls without warehouseId', async () => {
    prisma.warehouse.findFirst.mockResolvedValueOnce({ id: warehouseId });
    prisma.product.findMany.mockResolvedValueOnce([]);
    prisma.product.count.mockResolvedValueOnce(0);

    const stockManagerUser = {
      id: 'sm-user-id',
      personId,
      userRoles: [{ role: { name: 'INVENTORY_MANAGER' } }],
    };

    await getProducts({}, stockManagerUser);

    expect(prisma.warehouse.findFirst).toHaveBeenCalledWith({
      where: {
        manager: { personId, isArchived: false },
        isArchived: false,
      },
      select: { id: true },
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            {
              OR: [
                {
                  warehouseStocks: {
                    some: {
                      warehouseId,
                      isArchived: false,
                    },
                  },
                },
                {
                  warehouseSellingPrices: {
                    some: {
                      warehouseId,
                      isArchived: false,
                    },
                  },
                },
              ],
            },
          ]),
        }),
      })
    );
  });

  it('should not auto-scope when admin calls without warehouseId', async () => {
    prisma.product.findMany.mockResolvedValueOnce([]);
    prisma.product.count.mockResolvedValueOnce(0);

    const adminUser = {
      id: 'admin-user-id',
      personId,
      userRoles: [{ role: { name: 'ADMIN' } }],
    };

    await getProducts({}, adminUser);

    expect(prisma.warehouse.findFirst).not.toHaveBeenCalled();
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isArchived: false },
      })
    );
  });
});
