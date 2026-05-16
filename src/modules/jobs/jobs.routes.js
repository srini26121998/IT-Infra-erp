'use strict';
const express = require('express');
const ctrl = require('./jobs.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminHr = authorize('admin', 'hr', 'super-admin');

router.get('/', adminHr, ctrl.listJobs);
router.post('/', adminHr, ctrl.createJob);
router.get('/:id', adminHr, ctrl.getJob);
router.put('/:id', adminHr, ctrl.updateJob);
router.patch('/:id/status', adminHr, ctrl.patchStatus);
router.delete('/:id', adminHr, ctrl.deleteJob);

module.exports = router;
