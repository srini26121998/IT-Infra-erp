'use strict';

/**
 * HRM — Payroll Routes
 *
 * NOTE: Static sub-paths (/process, /settings) MUST come before /:id.
 * Salary structures and timesheets are mounted separately in app.js.
 */

const express  = require('express');
const ctrl     = require('./payroll.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const hrPlus    = authorize('super-admin', 'admin', 'hr');
const adminOnly = authorize('super-admin', 'admin');
const superOnly = authorize('super-admin');
const managerPlus = authorize('manager', 'admin', 'hr', 'super-admin');

// ── Static sub-paths (must precede /:id) ─────────────────────
router.post('/process',              hrPlus,    ctrl.processPayroll);
router.get ('/settings',             adminOnly, ctrl.listSettings);
router.put ('/settings/:companyId',  adminOnly, ctrl.updateSettings);

// ── Employee Maps ───────────────────────────────────────────
router.get ('/employee-maps',             hrPlus, ctrl.listEmployeeMaps);
router.get ('/employee-maps/:employeeId', hrPlus, ctrl.getEmployeeMap);
router.put ('/employee-maps/:employeeId', hrPlus, ctrl.updateEmployeeMap);

// ── Collection + create ───────────────────────────────────────
router.get ('/', hrPlus, ctrl.list);
router.post('/', hrPlus, ctrl.create);

// ── Single resource ───────────────────────────────────────────
router.get   ('/:id',         ctrl.getOne);          // Any Auth (self / hr+) — enforced in service
router.put   ('/:id', hrPlus, ctrl.update);
router.delete('/:id', superOnly, ctrl.remove);
router.get   ('/:id/payslip', ctrl.payslip);         // Any Auth (self / hr+)

// ─────────────────────────────────────────────────────────────
// Salary Structures — /salary-structures
// (mounted at /v1/salary-structures in app.js)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Timesheets — /timesheet
// (mounted at /v1/timesheet in app.js)
// ─────────────────────────────────────────────────────────────

module.exports = router;
