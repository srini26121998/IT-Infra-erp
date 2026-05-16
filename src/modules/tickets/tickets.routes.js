'use strict';
const express = require('express');
const ctrl = require('./tickets.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', ctrl.listTickets);
router.get('/stats', ctrl.getStats);
router.get('/export', ctrl.exportTickets);
router.post('/', ctrl.createTicket);
router.get('/:id', ctrl.getTicket);

router.post('/:id/assign', authorize('helpdesk', 'admin', 'super-admin'), ctrl.assignTicket);
router.post('/:id/submit', authorize('employee', 'helpdesk', 'admin', 'super-admin'), ctrl.submitWork);
router.post('/:id/review', authorize('manager', 'admin', 'super-admin'), ctrl.reviewTicket);
router.post('/acknowledge-all', authorize('admin', 'super-admin'), ctrl.acknowledgeAll);
router.post('/:id/acknowledge', ctrl.acknowledgeTicket);

module.exports = router;
