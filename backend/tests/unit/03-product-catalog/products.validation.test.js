import { describe, it, expect } from 'vitest';
import {
  productQuerySchema,
  productIdSchema,
  createProductSchema,
  updateProductSchema,
  productImageSchema,
} from '../../../src/modules/03-product-catalog/products/products.validation.js';

describe('Products Validation Schemas (Unit)', () => {
  const validUUID1 = '123e4567-e89b-12d3-a456-426614174000';
  const validUUID2 = '123e4567-e89b-12d3-a456-426614174001';
  const validUUID3 = '123e4567-e89b-12d3-a456-426614174002';
  const validWarehouseId = '123e4567-e89b-12d3-a456-426614174003';

  describe('createProductSchema', () => {
    it('should validate a complete valid product payload without requiring status', () => {
      const payload = {
        name: 'Organic Honey 500g',
        categoryId: validUUID1,
        brandId: validUUID2,
        unitId: validUUID3,
      };

      const result = createProductSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Organic Honey 500g');
    });

    it('should validate a payload with SKU, nested images, and warehouse selling prices', () => {
      const payload = {
        sku: 'HONEY-500',
        name: 'Organic Honey 500g',
        categoryId: validUUID1,
        brandId: validUUID2,
        unitId: validUUID3,
        images: [
          { imageUrl: 'https://example.com/honey.jpg', isPrimary: true },
        ],
        warehouseSellingPrices: [
          {
            warehouseId: validWarehouseId,
            sellingPrice: 150.5,
            wholesalePrice: 120.0,
          },
        ],
      };

      const result = createProductSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.sku).toBe('HONEY-500');
      expect(result.data.warehouseSellingPrices).toHaveLength(1);
    });

    it('should fail when name is missing or empty', () => {
      const payload = {
        name: '',
        categoryId: validUUID1,
        unitId: validUUID3,
      };

      const result = createProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail when categoryId or unitId is not a valid UUID', () => {
      const payload = {
        name: 'Test Product',
        categoryId: 'not-a-uuid',
        unitId: 'not-a-uuid',
      };

      const result = createProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail if warehouse selling price is negative', () => {
      const payload = {
        name: 'Test Product',
        categoryId: validUUID1,
        unitId: validUUID3,
        warehouseSellingPrices: [
          {
            warehouseId: validWarehouseId,
            sellingPrice: -10,
            wholesalePrice: 100,
          },
        ],
      };

      const result = createProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('updateProductSchema', () => {
    it('should validate partial update payload with optional status', () => {
      const payload = {
        name: 'Updated Product Name',
        status: 'INACTIVE',
      };

      const result = updateProductSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Product Name');
      expect(result.data.status).toBe('INACTIVE');
    });

    it('should allow updating warehouse selling prices array', () => {
      const payload = {
        warehouseSellingPrices: [
          {
            warehouseId: validWarehouseId,
            sellingPrice: 165.0,
            wholesalePrice: 135.0,
            status: 'ACTIVE',
          },
        ],
      };

      const result = updateProductSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe('productQuerySchema', () => {
    it('should coerce defaults for page and limit', () => {
      const result = productQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
      expect(result.data.includeArchived).toBe(false);
    });

    it('should accept valid filter parameters including productId and warehouseId', () => {
      const query = {
        page: '2',
        limit: '25',
        search: 'honey',
        status: 'ACTIVE',
        productId: validUUID1,
        categoryId: validUUID2,
        warehouseId: validWarehouseId,
        includeArchived: 'true',
      };

      const result = productQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(25);
      expect(result.data.productId).toBe(validUUID1);
      expect(result.data.warehouseId).toBe(validWarehouseId);
      expect(result.data.includeArchived).toBe(true);
    });
  });

  describe('productIdSchema', () => {
    it('should pass for valid UUID', () => {
      const result = productIdSchema.safeParse({ id: validUUID1 });
      expect(result.success).toBe(true);
    });

    it('should fail for non-UUID string', () => {
      const result = productIdSchema.safeParse({ id: '123' });
      expect(result.success).toBe(false);
    });
  });

  describe('productImageSchema', () => {
    it('should validate valid image URL and default isPrimary to false', () => {
      const result = productImageSchema.safeParse({
        imageUrl: 'https://images.example.com/item.png',
      });
      expect(result.success).toBe(true);
      expect(result.data.isPrimary).toBe(false);
    });

    it('should fail for invalid URL format', () => {
      const result = productImageSchema.safeParse({
        imageUrl: 'not-a-valid-url',
      });
      expect(result.success).toBe(false);
    });
  });
});
