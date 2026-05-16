'use strict';
const { validationResult } = require('express-validator');
const { error }            = require('../utils/response');

/**
 * After express-validator rules, call this to short-circuit on errors.
 */
const validate = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    const messages = errs.array().map(e => `${e.path}: ${e.msg}`).join('; ');
    return error(res, messages, 422);
  }
  next();
};

module.exports = { validate };
