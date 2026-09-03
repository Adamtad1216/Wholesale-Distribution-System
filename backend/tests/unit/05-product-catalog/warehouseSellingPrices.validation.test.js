import { describe, it, expect } from 'vitest';
import {
  warehouseSellingPriceQuerySchema,
  productIdParamSchema,
  createWarehouseSellingPriceSchema,
  updateWarehouseSellingPriceSchema,
} from '../../../src/modules/05-product-catalog/warehouse-selling-prices/warehouseSellingPrices.validation.js';

describe('Warehouse Selling Prices Validation Schemas (Unit)', () => {
  const validProductId = '123e4567-e89b-12d3-a456-426614174000';
  const validWarehouseId = '123e4567-e89b-12d3-a456-426614174001';

  describe('createWarehouseSellingPriceSchema', () => {
    it('should validate a correct price payload without requiring status', () => {
      const payload = {
        productId: validProductId,
        warehouseId: validWarehouseId,
        sellingPrice: 150.0,
        wholesalePrice: 120.0,
      };

      const result = createWarehouseSellingPriceSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.sellingPrice).toBe(150.0);
      expect(result.data.wholesalePrice).toBe(120.0);
    });

    it('should fail when productId or warehouseId is missing', () => {
      const payload = {
        sellingPrice: 150.0,
        wholesalePrice: 120.0,
      };

      const result = createWarehouseSellingPriceSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail when prices are negative', () => {
      const payload = {
        productId: validProductId,
        warehouseId: validWarehouseId,
        sellingPrice: -5,
        wholesalePrice: 10,
      };

      const result = createWarehouseSellingPriceSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('updateWarehouseSellingPriceSchema', () => {
    it('should validate partial price update with optional warehouseId', () => {
      const payload = {
        warehouseId: validWarehouseId,
        sellingPrice: 175.5,
        status: 'INACTIVE',
      };

      const result = updateWarehouseSellingPriceSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.sellingPrice).toBe(175.5);
      expect(result.data.warehouseId).toBe(validWarehouseId);
      expect(result.data.status).toBe('INACTIVE');
    });

    it('should fail when updating with negative price', () => {
      const payload = {
        wholesalePrice: -10,
      };

      const result = updateWarehouseSellingPriceSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('warehouseSellingPriceQuerySchema', () => {
    it('should validate query filters including productId', () => {
      const query = {
        page: '1',
        limit: '20',
        productId: validProductId,
        warehouseId: validWarehouseId,
        status: 'ACTIVE',
      };

      const result = warehouseSellingPriceQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      expect(result.data.productId).toBe(validProductId);
      expect(result.data.page).toBe(1);
    });
  });

  describe('productIdParamSchema', () => {
    it('should validate valid UUID for productId param', () => {
      const result = productIdParamSchema.safeParse({ productId: validProductId });
      expect(result.success).toBe(true);
    });

    it('should fail invalid UUID for productId param', () => {
      const result = productIdParamSchema.safeParse({ productId: 'abc' });
      expect(result.success).toBe(false);
    });
  });
});
