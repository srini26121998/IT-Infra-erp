'use strict';
const svc = require('./dashboard.service');
const { success } = require('../../utils/response');

const getSummary = async (req, res, next) => {
  try { return success(res, await svc.getSummary(), 'Dashboard summary'); }
  catch (e) { next(e); }
};

const getCharts = async (req, res, next) => {
  try { return success(res, await svc.getCharts(), 'Chart data'); }
  catch (e) { next(e); }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    return success(res, await svc.getRecentActivity(limit), 'Recent activity');
  } catch (e) { next(e); }
};

module.exports = { getSummary, getCharts, getRecentActivity };
