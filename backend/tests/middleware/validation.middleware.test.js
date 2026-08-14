import { describe, it, expect, vi } from 'vitest';
import { validate } from '../../src/middleware/validation.middleware.js';

describe('validate middleware', () => {
  it('returns 400 with validation errors for invalid body', () => {
    const schema = {
      safeParse: () => ({
        success: false,
        error: {
          flatten: () => ({
            fieldErrors: {
              name: ['Name is required'],
              email: ['Invalid email'],
            },
          }),
        },
      }),
    };

    const middleware = validate(schema);
    const req = { body: { name: '', email: 'invalid' } };
    const res = {
      status: (code) => {
        expect(code).toBe(400);
        return res;
      },
      json: (body) => {
        expect(body).toEqual({
          status: 'error',
          message: 'Validation failed',
          errors: {
            name: ['Name is required'],
            email: ['Invalid email'],
          },
        });
      },
    };
    const next = () => {};

    middleware(req, res, next);
  });

  it('calls next() with parsed data for valid body', () => {
    const schema = {
      safeParse: () => ({
        success: true,
        data: { name: 'John', email: 'john@example.com' },
      }),
    };

    const middleware = validate(schema);
    const req = { body: { name: 'John', email: 'john@example.com' } };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(req.body).toEqual({ name: 'John', email: 'john@example.com' });
    expect(next).toHaveBeenCalled();
  });
});
