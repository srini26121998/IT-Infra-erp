'use strict';
const svc = require('./attendance.service');
const { success, paginated } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;
    const companyId = req.user.role === 'super-admin' ? null : req.user.companyId;
    const { rows, total } = await svc.listAttendance({ date, status, page, limit, companyId });
    return paginated(res, rows, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { next(e); }
};

const me = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const employeeId = await svc.resolveEmployeeId(req.user);
    if (!employeeId) throw Object.assign(new Error('No employee profile linked to this user'), { status: 404 });
    return success(res, await svc.myAttendance(employeeId, { page, limit }), 'My attendance');
  } catch (e) { next(e); }
};

const checkIn = async (req, res, next) => {
  try {
    const employeeId = await svc.resolveEmployeeId(req.user);
    if (!employeeId) throw Object.assign(new Error('No employee profile linked to this user'), { status: 404 });
    return success(res, await svc.checkIn(employeeId, req.body), 'Checked in', 201);
  } catch (e) { next(e); }
};

const checkOut = async (req, res, next) => {
  try {
    const employeeId = await svc.resolveEmployeeId(req.user);
    if (!employeeId) throw Object.assign(new Error('No employee profile linked to this user'), { status: 404 });
    return success(res, await svc.checkOut(employeeId, req.body), 'Checked out');
  } catch (e) { next(e); }
};

const insights = async (req, res, next) => {
  try { return success(res, await svc.getInsights(req.params.empId), 'Insights'); }
  catch (e) { next(e); }
};

const patchStatus = async (req, res, next) => {
  try { 
    const status = req.body.status || req.body.admin_status;
    return success(res, await svc.patchStatus(req.params.id, status), 'Status updated'); 
  }
  catch (e) { next(e); }
};

const patchRemarks = async (req, res, next) => {
  try { 
    const remarks = req.body.remarks || req.body.admin_remarks;
    return success(res, await svc.patchRemarks(req.params.id, remarks), 'Remarks updated'); 
  }
  catch (e) { next(e); }
};

const getConfig = async (req, res, next) => {
  try { return success(res, await svc.getConfig(req.query.branchId), 'Office config'); }
  catch (e) { next(e); }
};

const updateConfig = async (req, res, next) => {
  try { return success(res, await svc.upsertConfig(req.body), 'Config updated'); }
  catch (e) { next(e); }
};

module.exports = { list, me, checkIn, checkOut, insights, patchStatus, patchRemarks, getConfig, updateConfig };
