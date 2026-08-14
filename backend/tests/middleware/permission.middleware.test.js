import { describe, it, expect } from 'vitest';
import { requirePermission } from '../../src/middleware/permission.middleware.js';

describe('requirePermission middleware', () => {
  it('returns 401 when req.user is missing', () => {
    const req = {};
    const res = {
      status: (code) => {
        expect(code).toBe(401);
        return res;
      },
      json: (body) => {
        expect(body).toEqual({
          status: 'error',
          message: 'Authentication required',
        });
      },
    };
    const next = () => {};

    requirePermission('customers:read')(req, res, next);
  });

  it('returns 403 when user lacks permission', () => {
    const req = {
      user: {
        userRoles: [
          {
            role: {
              rolePermissions: [
                { permission: { name: 'sales:read' } },
              ],
            },
          },
        ],
      },
    };
    const res = {
      status: (code) => {
        expect(code).toBe(403);
        return res;
      },
      json: (body) => {
        expect(body).toEqual({
          status: 'error',
          message: 'Insufficient permissions',
        });
      },
    };
    const next = () => {};

    requirePermission('customers:read')(req, res, next);
  });

  it('calls next() when user has permission', () => {
    const req = {
      user: {
        userRoles: [
          {
            role: {
              rolePermissions: [
                { permission: { name: 'customers:read' } },
                { permission: { name: 'sales:read' } },
              ],
            },
          },
        ],
      },
    };
    const res = {};
    const next = () => {};

    requirePermission('customers:read')(req, res, next);
  });
});
