'use strict';
const svc = require('./workflow.service');
const { success } = require('../../utils/response');

const listRequests = async (req, res, next) => {
  try { return success(res, await svc.listRequests({ role: req.user.role, userId: req.user.id, ...req.query })); } catch (e) { next(e); }
};
const createRequest = async (req, res, next) => {
  try { return success(res, await svc.createRequest(req.body, req.user.id), 'Request created', 201); } catch (e) { next(e); }
};
const getDashboard = async (req, res, next) => {
  try { return success(res, await svc.getDashboard()); } catch (e) { next(e); }
};
const updateStatus = async (req, res, next) => {
  try {
    const { status, feedback } = req.body;
    return success(res, await svc.updateStatus(req.params.id, status, feedback, req.user.name), 'Status updated');
  } catch (e) { next(e); }
};

module.exports = { listRequests, createRequest, getDashboard, updateStatus };
