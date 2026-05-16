'use strict';

const express  = require('express');
const ctrl     = require('./payroll.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const managerPlus = authorize('manager', 'admin', 'hr', 'super-admin');

// GET  /timesheet      — admin | hr | manager
// POST /timesheet      — Any Auth
// PATCH /timesheet/:id/approve — manager | admin
router.get  ('/',                 managerPlus, ctrl.listTimesheets);
router.post ('/',                              ctrl.submitTimesheet);
router.patch('/:id/approve', managerPlus,      ctrl.approveTimesheet);

module.exports = router;
