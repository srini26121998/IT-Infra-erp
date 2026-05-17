'use strict';

const svc = require('./payroll.service');
const { success, paginated } = require('../../utils/response');

// ─── Payroll Records ──────────────────────────────────────────

// GET /payroll
const list = async (req, res, next) => {
  try {
    const { month, year, companyId, search, page, limit } = req.query;
    const { rows, total } = await svc.listRecords({ month, year, companyId, search, page, limit });
    return paginated(res, rows, { total, page: +(page || 1), limit: +(limit || 20) });
  } catch (e) { next(e); }
};

// POST /payroll/process  — must come before /:id routes
const processPayroll = async (req, res, next) => {
  try { return success(res, await svc.processPayroll(req.body), 'Payroll processed', 201); }
  catch (e) { next(e); }
};

// GET /payroll/settings — must come before /:id
const listSettings = async (req, res, next) => {
  try { return success(res, await svc.listSettings(), 'Payroll settings'); }
  catch (e) { next(e); }
};

// GET /payroll/:id
const getOne = async (req, res, next) => {
  try { return success(res, await svc.getRecord(req.params.id)); }
  catch (e) { next(e); }
};

// POST /payroll
const create = async (req, res, next) => {
  try { return success(res, await svc.createRecord(req.body), 'Payroll record created', 201); }
  catch (e) { next(e); }
};

// PUT /payroll/:id
const update = async (req, res, next) => {
  try { return success(res, await svc.updateRecord(req.params.id, req.body), 'Payroll record updated'); }
  catch (e) { next(e); }
};

// DELETE /payroll/:id
const remove = async (req, res, next) => {
  try { await svc.deleteRecord(req.params.id); return success(res, null, 'Payroll record deleted'); }
  catch (e) { next(e); }
};

// GET /payroll/:id/payslip
const payslip = async (req, res, next) => {
  try { return success(res, await svc.getPayslip(req.params.id), 'Payslip'); }
  catch (e) { next(e); }
};

// PUT /payroll/settings/:companyId
const updateSettings = async (req, res, next) => {
  try { return success(res, await svc.updateSettings(req.params.companyId, req.body), 'Settings updated'); }
  catch (e) { next(e); }
};

// ─── Salary Structures ────────────────────────────────────────

// GET /salary-structures
const listStructures = async (req, res, next) => {
  try { return success(res, await svc.listStructures(req.query.companyId), 'Salary structures'); }
  catch (e) { next(e); }
};

// POST /salary-structures
const createStructure = async (req, res, next) => {
  try { return success(res, await svc.createStructure(req.body), 'Salary structure created', 201); }
  catch (e) { next(e); }
};

// ─── Employee Maps ───────────────────────────────────────────

// GET /payroll/employee-maps
const listEmployeeMaps = async (req, res, next) => {
  try { return success(res, await svc.listEmployeeMaps(req.query.companyId), 'Employee maps'); }
  catch (e) { next(e); }
};

// GET /payroll/employee-maps/:employeeId
const getEmployeeMap = async (req, res, next) => {
  try { return success(res, await svc.getEmployeeMap(req.params.employeeId), 'Employee map'); }
  catch (e) { next(e); }
};

// PUT /payroll/employee-maps/:employeeId
const updateEmployeeMap = async (req, res, next) => {
  try { return success(res, await svc.updateEmployeeMap(req.params.employeeId, req.body), 'Employee map updated'); }
  catch (e) { next(e); }
};

// ─── Timesheets ───────────────────────────────────────────────

// GET /timesheet
const listTimesheets = async (req, res, next) => {
  try {
    const { employeeId, month, year, status, page, limit } = req.query;
    return success(res, await svc.listTimesheets({ employeeId, month, year, status, page, limit }), 'Timesheets');
  } catch (e) { next(e); }
};

// POST /timesheet
const submitTimesheet = async (req, res, next) => {
  try { return success(res, await svc.submitTimesheet(req.user, req.body), 'Timesheet submitted', 201); }
  catch (e) { next(e); }
};

// PATCH /timesheet/:id/approve
const approveTimesheet = async (req, res, next) => {
  try { return success(res, await svc.approveTimesheet(req.params.id, req.user.id), 'Timesheet approved'); }
  catch (e) { next(e); }
};

module.exports = {
  list, processPayroll, listSettings, getOne, create, update, remove, payslip, updateSettings,
  listStructures, createStructure,
  listEmployeeMaps, getEmployeeMap, updateEmployeeMap,
  listTimesheets, submitTimesheet, approveTimesheet,
};
