'use strict';
const express = require('express');
const ctrl = require('./subscriptions.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public/Semi-public
router.get('/plans', authenticate, ctrl.listPlans);
router.post('/payment/webhook', ctrl.paymentWebhook); // HMAC verification should be middleware

// Authenticated
router.use(authenticate);

const adminOnly = authorize('admin', 'super-admin');
const superOnly = authorize('super-admin');

router.get('/', adminOnly, ctrl.listSubscriptions);
router.post('/', adminOnly, ctrl.createSubscription);
router.get('/:id', adminOnly, ctrl.getSubscription);
router.put('/:id', adminOnly, ctrl.updateSubscription);
router.delete('/:id', superOnly, ctrl.deleteSubscription);

router.post('/:id/renew', adminOnly, ctrl.renewSubscription);
router.post('/:id/reminder', adminOnly, ctrl.sendReminder);
router.post('/payment/initiate', adminOnly, ctrl.initiatePayment);

module.exports = router;
