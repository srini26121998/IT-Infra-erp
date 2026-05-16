'use strict';
const express = require('express');
const ctrl = require('./companies.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const superAdminOnly = authorize('super-admin');
const adminPlus = authorize('admin', 'super-admin');

router.get('/', adminPlus, ctrl.listCompanies);
router.post('/', superAdminOnly, ctrl.createCompany);
router.get('/:id', adminPlus, ctrl.getCompany);
router.put('/:id', adminPlus, ctrl.updateCompany);
router.patch('/:id/status', superAdminOnly, ctrl.patchStatus);
router.delete('/:id', superAdminOnly, ctrl.deleteCompany);

module.exports = router;
