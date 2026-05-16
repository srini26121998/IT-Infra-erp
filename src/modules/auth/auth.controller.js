'use strict';
const authService = require('./auth.service');
const { success, error } = require('../../utils/response');

// POST /v1/auth/login
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const data = await authService.login(identifier, password);
    return success(res, data, 'Login successful');
  } catch (err) { next(err); }
};

// POST /v1/auth/logout
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(req.user.id, refreshToken);
    return success(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
};

// POST /v1/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'refreshToken is required', 400);
    const data = await authService.refresh(refreshToken);
    return success(res, data, 'Token refreshed');
  } catch (err) { next(err); }
};

// POST /v1/auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, username, password, companyId } = req.body;
    const data = await authService.signup({ name, email, username, password, companyId });
    return success(res, data, 'Registration successful — please verify your email', 201);
  } catch (err) { next(err); }
};

// POST /v1/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    return success(res, null, 'If this email is registered, an OTP has been sent');
  } catch (err) { next(err); }
};

// POST /v1/auth/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, type } = req.body;
    const data = await authService.verifyOtp(email, otp, type);
    return success(res, data, 'OTP verified');
  } catch (err) { next(err); }
};

// POST /v1/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    await authService.resetPassword(email, resetToken, newPassword);
    return success(res, null, 'Password reset successfully');
  } catch (err) { next(err); }
};

// POST /v1/auth/send-otp
const sendOtp = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    await authService.sendOtp(email, type);
    return success(res, null, 'OTP sent successfully');
  } catch (err) { next(err); }
};

module.exports = { login, logout, refresh, signup, forgotPassword, verifyOtp, resetPassword, sendOtp };
