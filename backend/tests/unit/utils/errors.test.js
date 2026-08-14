import { describe, it, expect } from 'vitest';
import { AppError } from '../../../src/utils/errors.js';

describe('AppError', () => {
  it('creates an error with default status 500', () => {
    const error = new AppError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(500);
    expect(error.status).toBe('error');
    expect(error.isOperational).toBe(true);
  });

  it('creates an error with custom status code', () => {
    const error = new AppError('Not found', 404);
    expect(error.statusCode).toBe(404);
    expect(error.status).toBe('fail');
  });

  it('captures stack trace', () => {
    const error = new AppError('Test error', 400);
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('Test error');
  });
});
