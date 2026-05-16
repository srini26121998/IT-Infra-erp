'use strict';
const express = require('express');
const ctrl = require('./assets.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminOnly = authorize('admin', 'super-admin');
const superOnly = authorize('super-admin');

// Employee Assets
router.get('/employee', adminOnly, ctrl.listEmployeeAssets);
router.get('/employee/:id', adminOnly, ctrl.getEmployeeAssetById);
router.get('/employee/:id/history', adminOnly, ctrl.getAssetHistory);
router.post('/employee', adminOnly, ctrl.allocateAsset);
router.put('/employee/:id', adminOnly, ctrl.updateAllocation);
router.delete('/employee/:id', superOnly, ctrl.deleteAllocation);

// Company Assets
router.get('/company', adminOnly, ctrl.listCompanyAssets);
router.get('/company/:id', adminOnly, ctrl.getCompanyAssetById);
router.post('/company', adminOnly, ctrl.addCompanyAsset);
router.put('/company/:id', adminOnly, ctrl.updateCompanyAsset);
router.patch('/company/:id/deactivate', adminOnly, ctrl.deactivateCompanyAsset);
router.delete('/company/:id', superOnly, ctrl.deleteCompanyAsset);

// Asset Maintenance
router.get('/maintenance', adminOnly, ctrl.listMaintenanceLogs);
router.post('/maintenance', adminOnly, ctrl.addMaintenanceLog);
router.put('/maintenance/:id', adminOnly, ctrl.updateMaintenanceLog);
router.delete('/maintenance/:id', superOnly, ctrl.deleteMaintenanceLog);

// Asset Audits
router.get('/audits', adminOnly, ctrl.listAuditLogs);
router.post('/audits', adminOnly, ctrl.createAuditEntry);

module.exports = router;
