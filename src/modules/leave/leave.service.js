'use strict';

/**
 * Leave Management — Service Layer
 * Business rules: ownership checks, overlap detection, status guards.
 */

const model = require('./leave.model');
const { query } = require('../../db/pool');

/**
 * Resolve employee UUID from user context.
 */
const resolveEmployeeId = async (user) => {
  if (user.employeeId) return user.employeeId;
  const { rows } = await query('SELECT id FROM employees WHERE email = $1 AND deleted_at IS NULL LIMIT 1', [user.email]);
  return rows[0]?.id || null;
};

const VALID_TYPES   = ['Off-day', 'Full Day', 'Permission'];
const VALID_STATUS  = ['Approved', 'Rejected'];

// ─────────────────────────────────────────────────────────────

const list = ({ status, type, employeeId, page = 1, limit = 20 }) =>
  model.list({ status, type, employeeId, page: +page, limit: +limit });

const myLeave = async (user, { page = 1, limit = 30 }) => {
  const employeeId = await resolveEmployeeId(user);
  if (!employeeId) throw Object.assign(new Error('No employee profile linked to this user'), { status: 404 });
  return model.myLeave(employeeId, { page: +page, limit: +limit });
};

const getOne = async (id, user) => {
  const leave = await model.findById(id);
  if (!leave) throw Object.assign(new Error('Leave request not found'), { status: 404 });

  const employeeId = await resolveEmployeeId(user);
  const isOwner = leave.employee_id === employeeId;
  const isPrivileged = ['admin', 'hr', 'super-admin', 'manager'].includes(user.role);
  if (!isOwner && !isPrivileged) throw Object.assign(new Error('Access denied'), { status: 403 });

  return leave;
};

const apply = async (user, body) => {
  const employeeId = await resolveEmployeeId(user);
  if (!employeeId) throw Object.assign(new Error('No employee profile linked to this user'), { status: 404 });

  const { type, startDate, endDate, startTime, endTime, reason, backupSupportId } = body;

  if (!VALID_TYPES.includes(type))
    throw Object.assign(new Error(`type must be one of: ${VALID_TYPES.join(', ')}`), { status: 400 });

  // Overlap check — spec query
  const overlaps = await model.hasOverlap(employeeId, startDate, endDate);
  if (overlaps)
    throw Object.assign(new Error('You already have an approved or pending leave for these dates'), { status: 409 });

  return model.create({ employeeId, type, startDate, endDate, startTime, endTime, reason, backupSupportId });
};

const updateDraft = async (id, user, body) => {
  const employeeId = await resolveEmployeeId(user);
  if (!employeeId) throw Object.assign(new Error('No employee profile linked to this user'), { status: 404 });

  const leave = await model.findById(id);
  if (!leave)       throw Object.assign(new Error('Leave request not found'), { status: 404 });
  if (leave.employee_id !== employeeId)
    throw Object.assign(new Error('You can only update your own leave'), { status: 403 });
  const isPrivileged = ['admin', 'hr', 'super-admin'].includes(user.role);
  if (leave.status !== 'Pending' && !isPrivileged)
    throw Object.assign(new Error('Only Pending leave can be updated'), { status: 409 });

  // Re-check overlap excluding current request
  const overlaps = await model.hasOverlap(employeeId, body.startDate, body.endDate, id);
  if (overlaps) throw Object.assign(new Error('Date range overlaps with another leave'), { status: 409 });

  const updated = await model.update(id, body, isPrivileged);
  if (!updated) throw Object.assign(new Error('Update failed'), { status: 500 });
  return updated;
};

const withdraw = async (id, user) => {
  const employeeId = await resolveEmployeeId(user);
  if (!employeeId) throw Object.assign(new Error('No employee profile linked to this user'), { status: 404 });

  const leave = await model.findById(id);
  if (!leave) throw Object.assign(new Error('Leave request not found'), { status: 404 });
  if (leave.employee_id !== employeeId)
    throw Object.assign(new Error('You can only withdraw your own leave'), { status: 403 });
  const isPrivileged = ['admin', 'hr', 'super-admin'].includes(user.role);
  if (leave.status !== 'Pending' && !isPrivileged)
    throw Object.assign(new Error('Only Pending leave can be withdrawn'), { status: 409 });

  const deleted = await model.withdraw(id, leave.employee_id, isPrivileged);
  if (!deleted) throw Object.assign(new Error('Withdraw failed'), { status: 500 });
};

const updateStatus = async (id, user, { status, managerComment }) => {
  const managerId = await resolveEmployeeId(user);
  if (!managerId) throw Object.assign(new Error('No employee profile linked to this user'), { status: 404 });

  if (!VALID_STATUS.includes(status))
    throw Object.assign(new Error(`status must be Approved or Rejected`), { status: 400 });

  const leave = await model.findById(id);
  if (!leave) throw Object.assign(new Error('Leave request not found'), { status: 404 });

  const updated = await model.updateStatus(id, { status, managerId, managerComment });
  if (!updated) throw Object.assign(new Error('Status update failed'), { status: 500 });
  return updated;
};

const pendingForApproval = ({ page = 1, limit = 20 }) =>
  model.pendingForApproval({ page: +page, limit: +limit });

const balance = async (empId) => {
  const records = await model.balance(empId);
  const used = records.reduce((acc, r) => acc + Number(r.days_taken), 0);
  const total = 24; // Default annual entitlement

  return {
    totalBalance: total,
    usedBalance: used,
    remainingBalance: total - used,
    pendingCount: 0, // Placeholder for future enhancement
    details: records
  };
};

module.exports = { list, myLeave, getOne, apply, updateDraft, withdraw, updateStatus, pendingForApproval, balance };
