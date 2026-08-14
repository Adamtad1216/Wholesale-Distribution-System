export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 100,
};

export const getPaginationParams = (query = {}) => {
  const page = Math.max(1, Number(query.page) || PAGINATION_DEFAULTS.page);
  const limit = Math.min(
    PAGINATION_DEFAULTS.maxLimit,
    Math.max(1, Number(query.limit) || PAGINATION_DEFAULTS.limit)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPaginationMeta = ({ page, limit, total }) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
