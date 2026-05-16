'use strict';
const express = require('express');
const ctrl = require('./workflow.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminOnly = authorize('admin', 'super-admin');
const helpdeskPlus = authorize('helpdesk', 'admin', 'super-admin');

router.get('/', helpdeskPlus, ctrl.listRequests);
router.post('/', ctrl.createRequest);
router.get('/dashboard', ctrl.getDashboard);
router.patch('/:id/status', helpdeskPlus, ctrl.updateStatus);
router.get('/requests', helpdeskPlus, ctrl.listRequests); // Backward compatibility

module.exports = router;
