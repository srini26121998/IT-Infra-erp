'use strict';
const model = require('./dashboard.model');

const getSummary       = () => model.getSummary();
const getCharts        = () => model.getCharts();
const getRecentActivity = (limit) => model.getRecentActivity(limit);

module.exports = { getSummary, getCharts, getRecentActivity };
