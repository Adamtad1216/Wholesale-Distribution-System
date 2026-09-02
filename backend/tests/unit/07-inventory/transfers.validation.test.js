import { describe, it, expect } from 'vitest';
import {
  createTransferSchema,
  updateTransferSchema,
  transferQuerySchema,
  transferIdSchema,
} from '../../../src/modules/07-inventory/transfers/transfers.validation.js';

describe('Stock Transfers Validation (Unit)', () => {
  const validPayload = {
    fromWarehouseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    toWarehouseId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    productId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    transferReason: 'REBALANCING',
    quantity: 15.5,
    remark: 'Periodic rebalancing',
  };

  it('should validate a valid transfer payload', () => {
    const result = createTransferSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    expect(result.data.quantity).toBe(15.5);
  });

  it('should reject when fromWarehouseId and toWarehouseId are identical', () => {
    const identicalPayload = {
      ...validPayload,
      toWarehouseId: validPayload.fromWarehouseId,
    };
    const result = createTransferSchema.safeParse(identicalPayload);
    expect(result.success).toBe(false);
    const errors = result.error.flatten().fieldErrors;
    expect(errors.toWarehouseId).toBeDefined();
    expect(errors.toWarehouseId[0]).toContain('different');
  });

  it('should reject invalid UUIDs', () => {
    const invalidPayload = {
      ...validPayload,
      fromWarehouseId: 'invalid-uuid',
      productId: 'not-a-uuid',
    };
    const result = createTransferSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    const errors = result.error.flatten().fieldErrors;
    expect(errors.fromWarehouseId).toBeDefined();
    expect(errors.productId).toBeDefined();
  });

  it('should reject invalid transfer reason', () => {
    const invalidReasonPayload = {
      ...validPayload,
      transferReason: 'INVALID_REASON',
    };
    const result = createTransferSchema.safeParse(invalidReasonPayload);
    expect(result.success).toBe(false);
    const errors = result.error.flatten().fieldErrors;
    expect(errors.transferReason).toBeDefined();
  });

  it('should reject negative or zero quantity', () => {
    expect(createTransferSchema.safeParse({ ...validPayload, quantity: 0 }).success).toBe(false);
    expect(createTransferSchema.safeParse({ ...validPayload, quantity: -5 }).success).toBe(false);
  });

  it('should validate transfer query parameters including warehouseId and productId', () => {
    const query = {
      page: '2',
      limit: '25',
      warehouseId: validPayload.fromWarehouseId,
      productId: validPayload.productId,
      transferReason: 'RESTOCKING',
    };
    const result = transferQuerySchema.safeParse(query);
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(2);
    expect(result.data.limit).toBe(25);
    expect(result.data.warehouseId).toBe(validPayload.fromWarehouseId);
    expect(result.data.productId).toBe(validPayload.productId);
    expect(result.data.transferReason).toBe('RESTOCKING');
  });

  it('should validate transfer ID schema', () => {
    expect(transferIdSchema.safeParse({ id: validPayload.fromWarehouseId }).success).toBe(true);
    expect(transferIdSchema.safeParse({ id: 'bad-id' }).success).toBe(false);
  });

  it('should validate updateTransferSchema with partial and valid fields', () => {
    expect(updateTransferSchema.safeParse({ remark: 'Updated remark' }).success).toBe(true);
    expect(updateTransferSchema.safeParse({ quantity: 20 }).success).toBe(true);
    expect(updateTransferSchema.safeParse({ transferReason: 'RESTOCKING' }).success).toBe(true);
    expect(updateTransferSchema.safeParse({ quantity: -1 }).success).toBe(false);
    expect(updateTransferSchema.safeParse({ transferReason: 'UNKNOWN' }).success).toBe(false);
  });
});

