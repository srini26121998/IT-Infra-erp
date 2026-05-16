'use strict';
const express = require('express');
const ctrl = require('./roles.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const superAdminOnly = authorize('super-admin');
const adminPlus = authorize('admin', 'super-admin');

router.get('/', adminPlus, ctrl.listRoles);
router.post('/', superAdminOnly, ctrl.createRole);
router.get('/:id', adminPlus, ctrl.getRole);
router.put('/:id', superAdminOnly, ctrl.updateRole);
router.delete('/:id', superAdminOnly, ctrl.deleteRole);
router.put('/:id/permissions', superAdminOnly, ctrl.updatePermissions);

module.exports = router;
