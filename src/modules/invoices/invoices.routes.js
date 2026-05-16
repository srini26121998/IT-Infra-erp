'use strict';
const express = require('express');
const ctrl = require('./invoices.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminOnly = authorize('admin', 'super-admin');

router.get('/', adminOnly, ctrl.listInvoices);
router.post('/', adminOnly, ctrl.createInvoice);
router.get('/:id', adminOnly, ctrl.getInvoice);
router.patch('/:id/status', adminOnly, ctrl.updateStatus);
router.post('/:id/payments', adminOnly, ctrl.recordPayment);

module.exports = router;
