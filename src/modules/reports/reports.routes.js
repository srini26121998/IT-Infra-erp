'use strict';
const express = require('express');
const ctrl = require('./reports.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminPlus = authorize('hr', 'admin', 'super-admin');

router.get('/', adminPlus, ctrl.listTypes);
router.get('/data', adminPlus, ctrl.getReport);
router.get('/export', adminPlus, ctrl.exportReport);

module.exports = router;

