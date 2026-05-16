'use strict';

/**
 * Leave Management — Data Access Layer
 * All queries match the spec SQL exactly.
 */

const { query } = require('../../db/pool');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const BASE_SELECT = `
  SELECT
    lr.*,
    e.name          AS employee_name,
    e.employee_id   AS emp_code,
    d.name          AS department_name,
    des.name        AS designation_name,
    bs.name         AS backup_support_name
  FROM leave_requests lr
  JOIN employees      e   ON e.id   = lr.employee_id
  LEFT JOIN departments  d   ON d.id   = e.department_id
  LEFT JOIN designations des ON des.id = e.designation_id
  LEFT JOIN employees bs  ON bs.id  = lr.backup_support_id
`;

// ─────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────

/**
 * List all leave requests with optional filters + pagination.
 */
const list = async ({ status, type, employeeId, page, limit }) => {
  const offset = (page - 1) * limit;

  const dataRes = await query(
    `${BASE_SELECT}
      WHERE ($1::text IS NULL OR lr.status = $1)
        AND ($2::text IS NULL OR lr.type   = $2)
        AND ($3::uuid IS NULL OR lr.employee_id = $3)
      ORDER BY lr.applied_date DESC
      LIMIT $4 OFFSET $5`,
    [status || null, type || null, employeeId || null, limit, offset]
  );

  const countRes = await query(
    `SELECT COUNT(*) FROM leave_requests lr
      WHERE ($1::text IS NULL OR lr.status = $1)
        AND ($2::text IS NULL OR lr.type   = $2)
        AND ($3::uuid IS NULL OR lr.employee_id = $3)`,
    [status || null, type || null, employeeId || null]
  );

  return { rows: dataRes.rows, total: Number(countRes.rows[0].count) };
};

/**
 * Employee's own leave history.
 */
const myLeave = async (employeeId, { page, limit }) => {
  const offset = (page - 1) * limit;
  const { rows } = await query(
    `${BASE_SELECT}
      WHERE lr.employee_id = $1
      ORDER BY lr.applied_date DESC
      LIMIT $2 OFFSET $3`,
    [employeeId, limit, offset]
  );
  return rows;
};

/**
 * Single leave request by ID.
 */
const findById = async (id) => {
  const { rows } = await query(
    `${BASE_SELECT} WHERE lr.id = $1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Overlap check — prevent double booking (spec query).
 */
const hasOverlap = async (employeeId, startDate, endDate, excludeId = null) => {
  const { rows } = await query(
    `SELECT id FROM leave_requests
      WHERE employee_id = $1
        AND status != 'Rejected'
        AND (start_date, end_date) OVERLAPS ($2::DATE, $3::DATE)
        AND ($4::uuid IS NULL OR id != $4)`,
    [employeeId, startDate, endDate, excludeId || null]
  );
  return rows.length > 0;
};

/**
 * Apply for leave.
 */
const create = async ({ employeeId, type, startDate, endDate, startTime, endTime, reason, backupSupportId }) => {
  const { rows } = await query(
    `INSERT INTO leave_requests
       (employee_id, type, start_date, end_date, start_time, end_time, reason, backup_support_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [employeeId, type, startDate, endDate, startTime || null, endTime || null, reason, backupSupportId || null]
  );
  return rows[0];
};

/**
 * Update a draft (Pending) leave request.
 */
const update = async (id, { type, startDate, endDate, startTime, endTime, reason, backupSupportId }, force = false) => {
  const statusCheck = force ? '' : "AND status = 'Pending'";
  const { rows } = await query(
    `UPDATE leave_requests
        SET type              = $2,
            start_date        = $3,
            end_date          = $4,
            start_time        = $5,
            end_time          = $6,
            reason            = $7,
            backup_support_id = $8,
            updated_at        = NOW()
      WHERE id = $1 ${statusCheck}
      RETURNING *`,
    [id, type, startDate, endDate, startTime || null, endTime || null, reason, backupSupportId || null]
  );
  return rows[0] || null;
};

/**
 * Withdraw (soft delete) a Pending leave request.
 */
const withdraw = async (id, employeeId, force = false) => {
  const statusCheck = force ? '' : "AND status = 'Pending'";
  const { rowCount } = await query(
    `DELETE FROM leave_requests
      WHERE id = $1 AND employee_id = $2 ${statusCheck}`,
    [id, employeeId]
  );
  return rowCount > 0;
};

/**
 * Approve or reject — spec SQL.
 */
const updateStatus = async (id, { status, managerId, managerComment }) => {
  const { rows } = await query(
    `UPDATE leave_requests
        SET status          = $2,
            manager_id      = $3,
            manager_comment = $4,
            updated_at      = NOW()
      WHERE id = $1
      RETURNING *`,
    [id, status, managerId, managerComment || null]
  );
  return rows[0] || null;
};

/**
 * Pending requests for manager approval — spec query.
 */
const pendingForApproval = async ({ page, limit }) => {
  const offset = (page - 1) * limit;
  const { rows } = await query(
    `${BASE_SELECT}
      WHERE lr.status = 'Pending'
      ORDER BY lr.applied_date
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

/**
 * Leave balance — approved leaves taken this year grouped by type (spec query).
 */
const balance = async (employeeId) => {
  const { rows } = await query(
    `SELECT type, COUNT(*) AS days_taken
       FROM leave_requests
      WHERE employee_id = $1
        AND status = 'Approved'
        AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY type`,
    [employeeId]
  );
  return rows;
};

module.exports = { list, myLeave, findById, hasOverlap, create, update, withdraw, updateStatus, pendingForApproval, balance };
