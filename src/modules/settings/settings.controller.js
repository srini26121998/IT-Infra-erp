'use strict';
const svc = require('./settings.service');
const { success } = require('../../utils/response');

// Settings
const getSettings = async (req, res, next) => {
  try { return success(res, await svc.getSettings()); } catch (e) { next(e); }
};
const updateSettings = async (req, res, next) => {
  try { return success(res, await svc.updateSettings(req.body), 'Settings updated'); } catch (e) { next(e); }
};

// Profile
const updateProfile = async (req, res, next) => {
  try { return success(res, await svc.updateProfile(req.user.id, req.body), 'Profile updated'); } catch (e) { next(e); }
};
const changePassword = async (req, res, next) => {
  try { await svc.changePassword(req.user.id, req.body); return success(res, null, 'Password changed successfully'); } catch (e) { next(e); }
};

module.exports = { getSettings, updateSettings, updateProfile, changePassword };
