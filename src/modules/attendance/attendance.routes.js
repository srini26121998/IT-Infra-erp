'use strict';
const express = require('express');
const ctrl    = require('./attendance.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminHr      = authorize('super-admin', 'company', 'admin', 'hr');
const adminHrMgr   = authorize('super-admin', 'company', 'admin', 'hr', 'manager');
const superAdmin   = authorize('super-admin', 'company', 'admin');

// Config (before :id routes to avoid param clash)
router.get ('/config',           ctrl.getConfig);
router.put ('/config', superAdmin, ctrl.updateConfig);

// Own attendance
router.get ('/me',               ctrl.me);

// Check-in / check-out (Any Auth)
router.post('/checkin',          ctrl.checkIn);
router.post('/checkout',         ctrl.checkOut);

// Admin list
router.get ('/',      adminHr,   ctrl.list);

// Per-employee insights
router.get ('/:empId/insights', adminHrMgr, ctrl.insights);

// Admin approve/remark
router.patch('/:id/status',  adminHr, ctrl.patchStatus);
router.patch('/:id/remarks', adminHr, ctrl.patchRemarks);

module.exports = router;
