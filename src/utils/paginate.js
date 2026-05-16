'use strict';

/**
 * Calculate limit and offset for SQL pagination.
 */
function paginate(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return { limit: l, offset: (p - 1) * l, page: p };
}

/**
 * Format a paginated response with metadata.
 */
function paginatedResponse(data, total, page, limit) {
  return {
    success: true,
    data,
    meta: {
      total: parseInt(total),
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

module.exports = { paginate, paginatedResponse };
