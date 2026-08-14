import { describe, it, expect } from 'vitest';
import { getPaginationParams, buildPaginationMeta, PAGINATION_DEFAULTS } from '../../../src/utils/pagination.js';

describe('pagination', () => {
  it('returns default params when query is empty', () => {
    const result = getPaginationParams({});
    expect(result).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });

  it('parses page and limit from query', () => {
    const result = getPaginationParams({ page: '3', limit: '20' });
    expect(result).toEqual({
      page: 3,
      limit: 20,
      skip: 40,
    });
  });

  it('enforces max limit', () => {
    const result = getPaginationParams({ limit: '999' });
    expect(result.limit).toBe(PAGINATION_DEFAULTS.maxLimit);
  });

  it('prevents negative page and limit', () => {
    const result = getPaginationParams({ page: '-2', limit: '-5' });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
  });

  it('builds pagination meta correctly', () => {
    const meta = buildPaginationMeta({ page: 2, limit: 10, total: 25 });
    expect(meta).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('sets hasNextPage and hasPreviousPage correctly for first page', () => {
    const meta = buildPaginationMeta({ page: 1, limit: 10, total: 25 });
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPreviousPage).toBe(false);
  });

  it('sets hasNextPage and hasPreviousPage correctly for last page', () => {
    const meta = buildPaginationMeta({ page: 3, limit: 10, total: 25 });
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(true);
  });

  it('handles zero total', () => {
    const meta = buildPaginationMeta({ page: 1, limit: 10, total: 0 });
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });
});
