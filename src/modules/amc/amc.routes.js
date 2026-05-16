'use strict';
const express = require('express');
const ctrl = require('./amc.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminOnly = authorize('admin', 'super-admin');

// Contracts
router.get('/', adminOnly, ctrl.listContracts);
router.post('/', adminOnly, ctrl.createContract);
router.get('/penalty-report', adminOnly, ctrl.getPenaltyReport);
router.get('/:id', adminOnly, ctrl.getContract);
router.put('/:id', adminOnly, ctrl.updateContract);

// Tickets
router.get('/tickets', adminOnly, ctrl.listTickets);
router.post('/tickets', adminOnly, ctrl.createTicket);
router.get('/tickets/:id', adminOnly, ctrl.getTicket);
router.patch('/tickets/:id/status', adminOnly, ctrl.updateTicketStatus);

module.exports = router;
