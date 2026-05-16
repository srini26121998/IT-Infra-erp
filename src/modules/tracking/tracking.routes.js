'use strict';

const express = require('express');
const { getLiveTracking } = require('./tracking.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

// All tracking routes require authentication
router.use(authenticate);

router.get('/live', getLiveTracking);

module.exports = router;
