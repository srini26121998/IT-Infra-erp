'use strict';
const { body } = require('express-validator');

const loginRules = [
  body('identifier').notEmpty().withMessage('Email or username required'),
  body('password').notEmpty().withMessage('Password required'),
];

const signupRules = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const forgotPasswordRules = [
  body('email').isEmail().withMessage('Valid email required'),
];

const verifyOtpRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('type').isIn(['signup', 'forgot_password']).withMessage('Invalid OTP type'),
];

const resetPasswordRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('resetToken').notEmpty().withMessage('Reset token required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const sendOtpRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('type').optional().isIn(['signup', 'forgot_password']).withMessage('Invalid type'),
];

const refreshRules = [
  body('refreshToken').notEmpty().withMessage('refreshToken required'),
];

module.exports = {
  loginRules,
  signupRules,
  forgotPasswordRules,
  verifyOtpRules,
  resetPasswordRules,
  sendOtpRules,
  refreshRules,
};
