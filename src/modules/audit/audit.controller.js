'use strict';
const svc = require('./audit.service');
const { success } = require('../../utils/response');

const listLogs = async (req, res, next) => {
  try { return success(res, await svc.listLogs(req.query)); } catch (e) { next(e); }
};
const getLog = async (req, res, next) => {
  try {
    const log = await svc.getLogDetail(req.params.id);
    if (!log) throw Object.assign(new Error('Log entry not found'), { status: 404 });
    return success(res, log);
  } catch (e) { next(e); }
};

module.exports = { listLogs, getLog };
