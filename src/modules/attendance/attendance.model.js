'use strict';
const { query } = require('../../db/pool');

/* ─── List attendance (admin paginated) ──────────────────────── */
const listAttendance = async ({ date, status, page, limit, companyId }) => {
  const offset = (page - 1) * limit;
  const rows = await query(
    `SELECT a.*, e.name AS employee_name, e.employee_id AS emp_code
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
      WHERE ($1::date IS NULL OR a.date = $1)
        AND ($2::text IS NULL OR a.status = $2)
        AND ($5::uuid IS NULL OR e.company_id = $5)
      ORDER BY a.date DESC, e.name
      LIMIT $3 OFFSET $4`,
    [date || null, status || null, limit, offset, companyId || null]
  );

  const count = await query(
    `SELECT COUNT(*) FROM attendance a
       JOIN employees e ON e.id = a.employee_id
      WHERE ($1::date IS NULL OR a.date = $1)
        AND ($2::text IS NULL OR a.status = $2)
        AND ($3::uuid IS NULL OR e.company_id = $3)`,
    [date || null, status || null, companyId || null]
  );

  return { rows: rows.rows, total: Number(count.rows[0].count) };
};

/* ─── Own attendance ─────────────────────────────────────────── */
const myAttendance = async (employeeId, { page, limit }) => {
  const offset = (page - 1) * limit;
  const { rows } = await query(
    `SELECT * FROM attendance WHERE employee_id = $1
      ORDER BY date DESC LIMIT $2 OFFSET $3`,
    [employeeId, limit, offset]
  );
  return rows;
};

/* ─── Check-in ───────────────────────────────────────────────── */
const checkIn = async ({ employeeId, checkIn, status, lat, lng, isWfh, deviceInfo, gpsAccuracy }) => {
  const { rows } = await query(
    `INSERT INTO attendance
       (employee_id, date, check_in, status, check_in_lat, check_in_lng,
        is_wfh, is_late, device_info, gps_accuracy)
     VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (employee_id, date) DO NOTHING
     RETURNING *`,
    [employeeId, checkIn, status, lat || null, lng || null,
     isWfh || false, status === 'Late', deviceInfo || null, gpsAccuracy || null]
  );
  return rows[0] || null;
};

/* ─── Check-out ──────────────────────────────────────────────── */
const checkOut = async ({ employeeId, checkOutTime, lat, lng }) => {
  const { rows } = await query(
    `UPDATE attendance
        SET check_out      = $2,
            check_out_lat  = $3,
            check_out_lng  = $4,
            is_half_day    = CASE WHEN ($2::TIME - check_in) < INTERVAL '4 hours' THEN TRUE ELSE FALSE END,
            status         = CASE WHEN ($2::TIME - check_in) < INTERVAL '4 hours' THEN 'Half Day' ELSE status END,
            updated_at     = NOW()
      WHERE employee_id = $1 AND date = CURRENT_DATE AND check_out IS NULL
      RETURNING *`,
    [employeeId, checkOutTime, lat || null, lng || null]
  );
  return rows[0] || null;
};

/* ─── Insights for one employee ──────────────────────────────── */
const getInsights = async (employeeId) => {
  const { rows } = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('Present','WFH','Late')) AS present,
       COUNT(*) FILTER (WHERE status = 'Absent')                  AS absent,
       COUNT(*) FILTER (WHERE status = 'Half Day' OR is_half_day) AS half_day,
       COUNT(*) FILTER (WHERE is_late)                            AS late_days,
       COUNT(*) FILTER (WHERE is_wfh)                             AS wfh_days
     FROM attendance
     WHERE employee_id = $1
       AND date >= CURRENT_DATE - INTERVAL '30 days'`,
    [employeeId]
  );
  return rows[0];
};

/* ─── Patch admin_status ─────────────────────────────────────── */
const patchStatus = async (id, status) => {
  const { rows } = await query(
    `UPDATE attendance SET admin_status = $2, updated_at = NOW()
      WHERE id = $1 RETURNING id, admin_status`,
    [id, status]
  );
  return rows[0] || null;
};

/* ─── Patch remarks ──────────────────────────────────────────── */
const patchRemarks = async (id, remarks) => {
  const { rows } = await query(
    `UPDATE attendance SET admin_remarks = $2, updated_at = NOW()
      WHERE id = $1 RETURNING id, admin_remarks`,
    [id, remarks]
  );
  return rows[0] || null;
};

/* ─── Office config ──────────────────────────────────────────── */
const getConfig = async (branchId) => {
  const { rows } = await query(
    `SELECT * FROM office_config WHERE branch_id = $1 LIMIT 1`,
    [branchId || null]
  );
  return rows[0] || null;
};

const upsertConfig = async ({ branchId, officeLat, officeLng, geofenceRadius, shiftStartTime, shiftEndTime }) => {
  const { rows } = await query(
    `INSERT INTO office_config
       (branch_id, office_lat, office_lng, geofence_radius, shift_start_time, shift_end_time)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (branch_id) DO UPDATE SET
       office_lat       = $2, office_lng     = $3,
       geofence_radius  = $4, shift_start_time = $5,
       shift_end_time   = $6, updated_at     = NOW()
     RETURNING *`,
    [branchId || null, officeLat, officeLng, geofenceRadius || 200,
     shiftStartTime || '09:30', shiftEndTime || '18:30']
  );
  return rows[0];
};

const getMonthlySummary = async (month, year) => {
  const { rows } = await query(
    `SELECT
       employee_id,
       COUNT(*) FILTER (WHERE status IN ('Present','WFH','Late')) AS present,
       COUNT(*) FILTER (WHERE status = 'Absent')                  AS absent,
       COUNT(*) FILTER (WHERE status = 'Half Day' OR is_half_day) AS half_day,
       COUNT(*) FILTER (WHERE is_wfh)                             AS wfh_days
     FROM attendance
     WHERE EXTRACT(MONTH FROM date) = $1
       AND EXTRACT(YEAR FROM date) = $2
     GROUP BY employee_id`,
    [month, year]
  );
  return rows;
};

module.exports = {
  listAttendance, myAttendance, checkIn, checkOut,
  getInsights, patchStatus, patchRemarks, getConfig, upsertConfig, getMonthlySummary,
};
