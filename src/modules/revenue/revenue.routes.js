'use strict';
const express = require('express');
const ctrl = require('./revenue.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminOnly = authorize('admin', 'super-admin');
const superOnly = authorize('super-admin');

router.get('/summary', adminOnly, ctrl.getSummary);
router.get('/ra-bills', adminOnly, ctrl.listBills);
router.post('/ra-bills', adminOnly, ctrl.createBill);
router.get('/ra-bills/:id', adminOnly, ctrl.getBill);
router.patch('/ra-bills/:id', adminOnly, ctrl.updateBill);
router.patch('/ra-bills/:id/authorize', superOnly, ctrl.authorizeBill);

module.exports = router;
