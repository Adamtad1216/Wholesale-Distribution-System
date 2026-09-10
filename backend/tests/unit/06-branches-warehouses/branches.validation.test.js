import { describe, it, expect } from 'vitest';
import {
  createBranchSchema,
  updateBranchSchema,
  assignBranchManagerSchema,
} from '../../../src/modules/06-branches-warehouses/branches/branches.validation.js';

describe('Branch Validation Schemas (Unit)', () => {
  const validCompanyId = '123e4567-e89b-12d3-a456-426614174000';
  const validRegionId = '123e4567-e89b-12d3-a456-426614174001';
  const validEmployeeId = '123e4567-e89b-12d3-a456-426614174002';

  describe('createBranchSchema', () => {
    it('should validate branch creation with a valid managerId', () => {
      const payload = {
        companyId: validCompanyId,
        branchCode: 'BR-TEST-01',
        name: 'Test Branch Alpha',
        regionId: validRegionId,
        managerId: validEmployeeId,
      };

      const result = createBranchSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.managerId).toBe(validEmployeeId);
    });

    it('should transform empty string managerId to null', () => {
      const payload = {
        companyId: validCompanyId,
        branchCode: 'BR-TEST-02',
        name: 'Test Branch Beta',
        regionId: validRegionId,
        managerId: '',
      };

      const result = createBranchSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.managerId).toBeNull();
    });

    it('should accept null managerId', () => {
      const payload = {
        companyId: validCompanyId,
        branchCode: 'BR-TEST-03',
        name: 'Test Branch Gamma',
        regionId: validRegionId,
        managerId: null,
      };

      const result = createBranchSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.managerId).toBeNull();
    });

    it('should fail on invalid managerId uuid format', () => {
      const payload = {
        companyId: validCompanyId,
        branchCode: 'BR-TEST-04',
        name: 'Test Branch Delta',
        regionId: validRegionId,
        managerId: 'not-a-valid-uuid',
      };

      const result = createBranchSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('updateBranchSchema', () => {
    it('should transform empty string managerId to null on update', () => {
      const payload = {
        name: 'Updated Branch Name',
        managerId: '',
      };

      const result = updateBranchSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.managerId).toBeNull();
    });

    it('should accept a new valid managerId on update', () => {
      const payload = {
        managerId: validEmployeeId,
      };

      const result = updateBranchSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.managerId).toBe(validEmployeeId);
    });
  });

  describe('assignBranchManagerSchema', () => {
    it('should validate manager assignment payload', () => {
      const payload = {
        employeeId: validEmployeeId,
        notes: 'Promoted to Branch Manager',
      };

      const result = assignBranchManagerSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.employeeId).toBe(validEmployeeId);
      expect(result.data.notes).toBe('Promoted to Branch Manager');
    });

    it('should allow clearing manager assignment with null or empty string', () => {
      const payload = {
        employeeId: '',
        notes: 'Manager stepped down',
      };

      const result = assignBranchManagerSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.employeeId).toBeNull();
    });
  });
});
