'use strict';
const express = require('express');
const ctrl = require('./audit.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminOnly = authorize('admin', 'super-admin');

router.get('/', adminOnly, ctrl.listLogs);
router.get('/:id', adminOnly, ctrl.getLog);

module.exports = router;
