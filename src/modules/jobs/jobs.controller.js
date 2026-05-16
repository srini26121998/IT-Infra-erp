'use strict';
const svc = require('./jobs.service');
const { success, paginated } = require('../../utils/response');

const listJobs = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const { rows, total } = await svc.listJobs({ status, page, limit });
    return paginated(res, rows, { total, page: +(page || 1), limit: +(limit || 20) });
  } catch (e) { next(e); }
};

const getJob = async (req, res, next) => {
  try {
    const job = await svc.getJob(req.params.id);
    if (!job) throw Object.assign(new Error('Job not found'), { status: 404 });
    return success(res, job);
  } catch (e) { next(e); }
};

const createJob = async (req, res, next) => {
  try { return success(res, await svc.createJob(req.body, req.user.id), 'Job opening created', 201); } catch (e) { next(e); }
};

const updateJob = async (req, res, next) => {
  try { return success(res, await svc.updateJob(req.params.id, req.body), 'Job opening updated'); } catch (e) { next(e); }
};

const patchStatus = async (req, res, next) => {
  try { return success(res, await svc.patchStatus(req.params.id, req.body.status), 'Job status updated'); } catch (e) { next(e); }
};

const deleteJob = async (req, res, next) => {
  try { await svc.deleteJob(req.params.id); return success(res, null, 'Job opening deleted'); } catch (e) { next(e); }
};

module.exports = { listJobs, getJob, createJob, updateJob, patchStatus, deleteJob };
