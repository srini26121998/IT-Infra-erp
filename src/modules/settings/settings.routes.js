'use strict';
const express = require('express');
const ctrl = require('./settings.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// Global Settings (Admin Only)
router.get('/global', authorize('admin', 'super-admin'), ctrl.getSettings);
router.put('/global', authorize('super-admin'), ctrl.updateSettings);

// User Profile (All Authenticated)
router.patch('/profile', ctrl.updateProfile);
router.post('/profile/change-password', ctrl.changePassword);

module.exports = router;
