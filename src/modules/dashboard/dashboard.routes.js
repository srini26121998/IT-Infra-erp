'use strict';
const express = require('express');
const ctrl    = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

// All dashboard routes require any valid JWT
router.use(authenticate);

router.get('/summary',         ctrl.getSummary);
router.get('/charts',          ctrl.getCharts);
router.get('/recent-activity', ctrl.getRecentActivity);

module.exports = router;
