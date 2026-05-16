'use strict';
const express = require('express');
const ctrl = require('./branches.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminPlus = authorize('admin', 'super-admin', 'hr');
const adminOnly = authorize('admin', 'super-admin');
const superOnly = authorize('super-admin');

router.get('/', adminPlus, ctrl.listBranches);
router.post('/', adminOnly, ctrl.createBranch);
router.get('/:id', adminPlus, ctrl.getBranch);
router.put('/:id', adminOnly, ctrl.updateBranch);
router.delete('/:id', superOnly, ctrl.deleteBranch);

module.exports = router;
