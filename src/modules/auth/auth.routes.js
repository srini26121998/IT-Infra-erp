'use strict';
const express  = require('express');
const ctrl     = require('./auth.controller');
const v        = require('./auth.validators');
const { validate }      = require('../../middleware/validate.middleware');
const { authenticate }  = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/login',            v.loginRules,           validate, ctrl.login);
router.post('/signup',           v.signupRules,          validate, ctrl.signup);
router.post('/forgot-password',  v.forgotPasswordRules,  validate, ctrl.forgotPassword);
router.post('/verify-otp',       v.verifyOtpRules,       validate, ctrl.verifyOtp);
router.post('/reset-password',   v.resetPasswordRules,   validate, ctrl.resetPassword);
router.post('/send-otp',         v.sendOtpRules,         validate, ctrl.sendOtp);
router.post('/refresh',          v.refreshRules,         validate, ctrl.refresh);

// Protected routes (require valid Bearer token)
router.post('/logout', authenticate, ctrl.logout);

module.exports = router;
