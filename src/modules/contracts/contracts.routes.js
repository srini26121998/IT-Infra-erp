'use strict';
const express = require('express');
const ctrl = require('./contracts.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminOnly = authorize('admin', 'super-admin');
const superOnly = authorize('super-admin');

router.get('/', adminOnly, ctrl.listContracts);
router.post('/', adminOnly, ctrl.createContract);
router.get('/:id', adminOnly, ctrl.getContract);
router.put('/:id', adminOnly, ctrl.updateContract);
router.patch('/:id/status', adminOnly, ctrl.advanceStatus);
router.delete('/:id', superOnly, ctrl.deleteContract);

module.exports = router;
