'use strict';
const model = require('./attendance.model');
const { query } = require('../../db/pool');

/**
 * Resolve employee UUID from user context.
 * Useful if the user token is missing employeeId but they have a matching employee record by email.
 */
const resolveEmployeeId = async (user) => {
  if (user.employeeId) return user.employeeId;

  // Fallback: try to find employee by email
  const { rows } = await query('SELECT id FROM employees WHERE email = $1 AND deleted_at IS NULL LIMIT 1', [user.email]);
  return rows[0]?.id || null;
};

const listAttendance = async ({ date, status, page = 1, limit = 20, companyId }) =>
  model.listAttendance({ date, status, page: Number(page), limit: Number(limit), companyId });

const myAttendance = async (employeeId, { page = 1, limit = 30 }) =>
  model.myAttendance(employeeId, { page: Number(page), limit: Number(limit) });

const checkIn = async (employeeId, body) => {
  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5); // HH:MM

  const rec = await model.checkIn({
    employeeId,
    checkIn      : timeStr,
    status       : body.isWfh ? 'WFH' : 'Present',
    lat          : body.lat,
    lng          : body.lng,
    isWfh        : body.isWfh || false,
    deviceInfo   : body.deviceInfo,
    gpsAccuracy  : body.gpsAccuracy,
  });

  if (!rec) throw Object.assign(new Error('Already checked in today'), { status: 409 });
  return rec;
};

const checkOut = async (employeeId, body) => {
  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5); // HH:MM

  const rec = await model.checkOut({
    employeeId,
    checkOutTime: timeStr,
    lat: body.lat,
    lng: body.lng,
  });

  if (!rec) throw Object.assign(new Error('No open check-in found for today'), { status: 400 });
  return rec;
};

const getInsights = async (id) => {
  // 1. Try to find if this ID is an attendance record ID
  const { rows: attRows } = await query('SELECT * FROM attendance WHERE id = $1', [id]);
  
  let employeeId;
  let specificRecord = null;
  
  if (attRows.length > 0) {
    specificRecord = attRows[0];
    employeeId = specificRecord.employee_id;
  } else {
    // 2. Otherwise assume it is an employee ID
    employeeId = id;
  }

  // 3. Get 30-day stats for the employee
  const stats = await model.getInsights(employeeId);
  
  // 4. If we didn't have a specific record, get the latest one
  if (!specificRecord) {
    const { rows: latestRows } = await query(
      'SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC, created_at DESC LIMIT 1', 
      [employeeId]
    );
    specificRecord = latestRows[0] || null;
  }

  return {
    ...stats,
    latest_record: specificRecord
  };
};

const patchStatus = async (id, status) => {
  const valid = ['approved', 'rejected', 'half-day', 'pending'];
  if (!valid.includes(status)) throw Object.assign(new Error(`Status must be one of: ${valid.join(', ')}`), { status: 400 });
  const rec = await model.patchStatus(id, status);
  if (!rec) throw Object.assign(new Error('Record not found'), { status: 404 });
  return rec;
};

const patchRemarks = async (id, remarks) => {
  const rec = await model.patchRemarks(id, remarks);
  if (!rec) throw Object.assign(new Error('Record not found'), { status: 404 });
  return rec;
};

const getConfig  = (branchId)   => model.getConfig(branchId);
const upsertConfig = (data)     => model.upsertConfig(data);

module.exports = {
  listAttendance, myAttendance, checkIn, checkOut,
  getInsights, patchStatus, patchRemarks, getConfig, upsertConfig, resolveEmployeeId
};
