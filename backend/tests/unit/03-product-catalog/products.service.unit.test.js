import { describe, it, expect, vi } from 'vitest';
import {
  generateProductCode,
  ensureUniqueSku,
} from '../../../src/modules/03-product-catalog/products/products.service.js';

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
