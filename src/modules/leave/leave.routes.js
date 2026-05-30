'use strict';

/**
 * HRM — Leave Management Routes
 *
 * NOTE: Static sub-paths (/me, /approval, /balance) MUST be registered
 * before parameterised /:id to avoid Express treating them as IDs.
 */

const express  = require('express');
const ctrl     = require('./leave.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const managerPlus = authorize('manager', 'admin', 'hr', 'super-admin');
const adminHr     = authorize('admin', 'hr', 'super-admin');

// ── Static sub-paths first ────────────────────────────────────
router.get('/me',                  ctrl.myLeave);
router.get('/approval', managerPlus, ctrl.pendingForApproval);
router.get('/balance/:empId', adminHr, ctrl.balance);   // admin|hr|self enforced in service

// ── Collection ────────────────────────────────────────────────
router.get ('/', managerPlus, ctrl.list);
router.post('/',              ctrl.apply);               // Any Auth

// ── Single resource ───────────────────────────────────────────
router.get   ('/:id',             ctrl.getOne);          // Any Auth — ownership check in service
router.put   ('/:id',             ctrl.update);          // Self (Pending only) — enforced in service
router.delete('/:id',             ctrl.withdraw);        // Self (Pending only) — enforced in service
router.patch ('/:id/status', managerPlus, ctrl.updateStatus);
router.patch ('/:id',        managerPlus, ctrl.updateStatus);

module.exports = router;
