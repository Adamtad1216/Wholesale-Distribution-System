import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/jwt.js', () => ({
  verifyAccessToken: vi.fn(),
}));

vi.mock('../../src/config/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { verifyAccessToken } from '../../src/utils/jwt.js';
import prisma from '../../src/config/prisma.js';
import { authenticate } from '../../src/middleware/auth.middleware.js';

describe('authenticate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no authorization header is present', async () => {
    const req = { headers: {} };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Access token missing or invalid',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    const next = vi.fn();

    verifyAccessToken.mockImplementation(() => {
      throw new Error('invalid token');
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when user is not found', async () => {
    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    const next = vi.fn();

    verifyAccessToken.mockImplementation(() => ({ userId: 'user-1' }));
    prisma.user.findUnique.mockResolvedValue(null);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when token is valid and user is active', async () => {
    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    const next = vi.fn();

    verifyAccessToken.mockImplementation(() => ({ userId: 'user-1', username: 'testuser' }));
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      userRoles: [],
    });

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: 'user-1',
      isActive: true,
      userRoles: [],
    });
  });
});
