'use strict';

const svc = require('./leave.service');
const { success, paginated } = require('../../utils/response');

// GET /leave
const list = async (req, res, next) => {
  try {
    const { status, type, employeeId, page, limit } = req.query;
    const { rows, total } = await svc.list({ status, type, employeeId, page, limit });
    return paginated(res, rows, { total, page: +(page || 1), limit: +(limit || 20) });
  } catch (e) { next(e); }
};

// GET /leave/me
const myLeave = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    return success(res, await svc.myLeave(req.user, { page, limit }), 'My leave requests');
  } catch (e) { next(e); }
};

// POST /leave
const apply = async (req, res, next) => {
  try { return success(res, await svc.apply(req.user, req.body), 'Leave applied', 201); }
  catch (e) { next(e); }
};

// GET /leave/approval
const pendingForApproval = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    return success(res, await svc.pendingForApproval({ page, limit }), 'Pending approvals');
  } catch (e) { next(e); }
};

// GET /leave/balance/:empId
const balance = async (req, res, next) => {
  try { return success(res, await svc.balance(req.params.empId), 'Leave balance'); }
  catch (e) { next(e); }
};

// GET /leave/:id
const getOne = async (req, res, next) => {
  try { return success(res, await svc.getOne(req.params.id, req.user)); }
  catch (e) { next(e); }
};

// PUT /leave/:id
const update = async (req, res, next) => {
  try { return success(res, await svc.updateDraft(req.params.id, req.user, req.body), 'Leave updated'); }
  catch (e) { next(e); }
};

// DELETE /leave/:id
const withdraw = async (req, res, next) => {
  try { await svc.withdraw(req.params.id, req.user); return success(res, null, 'Leave withdrawn'); }
  catch (e) { next(e); }
};

// PATCH /leave/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const { status, managerComment } = req.body;
    return success(res, await svc.updateStatus(req.params.id, req.user, { status, managerComment }), 'Status updated');
  } catch (e) { next(e); }
};

module.exports = { list, myLeave, apply, pendingForApproval, balance, getOne, update, withdraw, updateStatus };
