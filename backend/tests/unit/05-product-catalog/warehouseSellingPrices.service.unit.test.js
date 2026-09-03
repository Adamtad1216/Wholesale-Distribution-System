import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/config/prisma.js', () => ({
  default: {
    product: { findFirst: vi.fn() },
    warehouse: { findFirst: vi.fn() },
    warehouseSellingPrice: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
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
import { createWarehouseSellingPrice } from '../../../src/modules/05-product-catalog/warehouse-selling-prices/warehouseSellingPrices.service.js';

describe('Warehouse Selling Prices Service - createWarehouseSellingPrice (Unit)', () => {
  const productId = '123e4567-e89b-12d3-a456-426614174000';
  const warehouseId = '123e4567-e89b-12d3-a456-426614174001';
  const userId = '123e4567-e89b-12d3-a456-426614174002';

  const validPayload = {
    productId,
    warehouseId,
    sellingPrice: 150.0,
    wholesalePrice: 120.0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw 404 if product does not exist or is archived', async () => {
    prisma.product.findFirst.mockResolvedValueOnce(null);

    await expect(
      createWarehouseSellingPrice(validPayload, userId)
    ).rejects.toThrow('Product not found');
  });

  it('should throw 404 if warehouse does not exist or is archived', async () => {
    prisma.product.findFirst.mockResolvedValueOnce({ id: productId, name: 'Product 1' });
    prisma.warehouse.findFirst.mockResolvedValueOnce(null);

    await expect(
      createWarehouseSellingPrice(validPayload, userId)
    ).rejects.toThrow('Warehouse not found');
  });

  it('should reject with 409 if a non-archived selling price already exists for this product in the warehouse', async () => {
    prisma.product.findFirst.mockResolvedValueOnce({ id: productId, name: 'Product 1' });
    prisma.warehouse.findFirst.mockResolvedValueOnce({ id: warehouseId, name: 'Central Warehouse' });

    // Existing active (non-archived) price
    prisma.warehouseSellingPrice.findUnique.mockResolvedValueOnce({
      id: 'existing-price-id',
      productId,
      warehouseId,
      sellingPrice: 140.0,
      wholesalePrice: 110.0,
      isArchived: false,
    });

    await expect(
      createWarehouseSellingPrice(validPayload, userId)
    ).rejects.toThrow('Warehouse selling price already exists for this product in this warehouse');
  });

  it('should restore an archived selling price record if one exists', async () => {
    prisma.product.findFirst.mockResolvedValueOnce({ id: productId, name: 'Product 1' });
    prisma.warehouse.findFirst.mockResolvedValueOnce({ id: warehouseId, name: 'Central Warehouse' });

    // Existing archived price
    prisma.warehouseSellingPrice.findUnique.mockResolvedValueOnce({
      id: 'existing-archived-id',
      productId,
      warehouseId,
      sellingPrice: 140.0,
      wholesalePrice: 110.0,
      isArchived: true,
    });

    const mockUpdatedPrice = {
      id: 'existing-archived-id',
      productId,
      warehouseId,
      sellingPrice: 150.0,
      wholesalePrice: 120.0,
      status: 'ACTIVE',
      isArchived: false,
      product: { id: productId, name: 'Product 1', sku: 'P1' },
      warehouse: { id: warehouseId, code: 'WH-01', name: 'Central Warehouse' },
    };
    prisma.warehouseSellingPrice.update.mockResolvedValueOnce(mockUpdatedPrice);
    prisma.warehouseSellingPrice.findFirst.mockResolvedValueOnce(mockUpdatedPrice);

    const result = await createWarehouseSellingPrice(validPayload, userId);
    expect(result.id).toBe('existing-archived-id');
    expect(prisma.warehouseSellingPrice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'existing-archived-id' },
        data: expect.objectContaining({
          isArchived: false,
          sellingPrice: 150.0,
        }),
      })
    );
  });

  it('should successfully create a new warehouse selling price when no existing record found', async () => {
    prisma.product.findFirst.mockResolvedValueOnce({ id: productId, name: 'Product 1' });
    prisma.warehouse.findFirst.mockResolvedValueOnce({ id: warehouseId, name: 'Central Warehouse' });
    prisma.warehouseSellingPrice.findUnique.mockResolvedValueOnce(null);

    const mockCreatedPrice = {
      id: 'new-price-id',
      productId,
      warehouseId,
      sellingPrice: 150.0,
      wholesalePrice: 120.0,
      status: 'ACTIVE',
      product: { id: productId, name: 'Product 1', sku: 'P1' },
      warehouse: { id: warehouseId, code: 'WH-01', name: 'Central Warehouse' },
    };
    prisma.warehouseSellingPrice.create.mockResolvedValueOnce(mockCreatedPrice);
    prisma.warehouseSellingPrice.findFirst.mockResolvedValueOnce(mockCreatedPrice);

    const result = await createWarehouseSellingPrice(validPayload, userId);
    expect(result.id).toBe('new-price-id');
    expect(prisma.warehouseSellingPrice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId,
          warehouseId,
          sellingPrice: 150.0,
          wholesalePrice: 120.0,
        }),
      })
    );
  });
});
