'use strict';
const { verifyAccessToken } = require('../utils/jwt');
const { error }             = require('../utils/response');

/**
 * Protect routes — validates Bearer JWT.
 * Attaches decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authorization token required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return error(res, msg, 401);
  }
};

/**
 * Role-based access control.
 * @param {...string} roles  Allowed roles
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return error(res, 'Not authenticated', 401);
  if (!roles.includes(req.user.role)) {
    return error(res, 'Insufficient permissions', 403);
  }
  next();
};

module.exports = { authenticate, authorize };
