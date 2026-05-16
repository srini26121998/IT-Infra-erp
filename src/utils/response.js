'use strict';

/**
 * Standard success response.
 * @param {import('express').Response} res
 * @param {any}    data
 * @param {string} message
 * @param {number} statusCode
 */
const success = (res, data = null, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

/**
 * Standard error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 */
const error = (res, message = 'Error', statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });

/**
 * Paginated response helper.
 * @param {import('express').Response} res
 * @param {any[]}  data
 * @param {{ total: number, page: number, limit: number }} meta
 */
const paginated = (res, data, { total, page, limit }) =>
  res.status(200).json({
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });

module.exports = { success, error, paginated };
