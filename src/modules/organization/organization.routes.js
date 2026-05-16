'use strict';
const express = require('express');
const ctrl = require('./organization.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminHr = authorize('admin', 'hr', 'super-admin');
const superOnly = authorize('super-admin');

// Departments
router.get('/departments', adminHr, ctrl.listDepartments);
router.post('/departments', adminHr, ctrl.createDepartment);
router.put('/departments/:id', adminHr, ctrl.updateDepartment);
router.delete('/departments/:id', superOnly, ctrl.deleteDepartment);

// Designations
router.get('/designations', adminHr, ctrl.listDesignations);
router.post('/designations', adminHr, ctrl.createDesignation);
router.put('/designations/:id', adminHr, ctrl.updateDesignation);
router.delete('/designations/:id', superOnly, ctrl.deleteDesignation);

module.exports = router;
