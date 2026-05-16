'use strict';
const model = require('./settings.model');

const getSettings = () => model.getSettings();
const updateSettings = (data) => model.updateSettings(data);
const updateProfile = (userId, data) => model.updateProfile(userId, data);
const changePassword = (userId, data) => model.changePassword(userId, data);

module.exports = { getSettings, updateSettings, updateProfile, changePassword };
