'use strict';
const { query } = require('../../db/pool');

/* ─── KPI Summary ───────────────────────────────────────────── */
const getSummary = async () => {
  const [
    employees, assets, amcCount, payrollVolume,
    revenueTarget, overdueCount, amcExpiringSoon,
    revenueSnapshot, tickets
  ] = await Promise.all([
    query(`SELECT COUNT(*) AS total_employees FROM employees WHERE status = 'Active' AND deleted_at IS NULL`),
    query(`SELECT COUNT(*) AS total_assets FROM assets WHERE status != 'Retired' AND deleted_at IS NULL`).catch(() => ({ rows: [{ total_assets: 0 }] })),
    query(`SELECT COUNT(*) AS active_amc FROM amc_contracts WHERE deleted_at IS NULL`).catch(() => ({ rows: [{ active_amc: 0 }] })),
    query(`SELECT COALESCE(SUM(net_salary), 0) AS total_payroll FROM payroll_records`).catch(() => ({ rows: [{ total_payroll: 0 }] })),
    query(`SELECT COALESCE(SUM(total_invoice_value), 0) AS total_revenue FROM ra_bills`).catch(() => ({ rows: [{ total_revenue: 0 }] })),
    query(`SELECT COUNT(*) AS overdue FROM tickets WHERE (deadline < NOW() AND status != 'Approved') OR sla_status = 'Breached'`).catch(() => ({ rows: [{ overdue: 0 }] })),
    query(`SELECT * FROM amc_contracts WHERE deleted_at IS NULL AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days' ORDER BY end_date ASC`).catch(() => ({ rows: [] })),
    query(`
      SELECT COUNT(*) AS total_bills,
             COUNT(*) FILTER (WHERE status = 'Approved') AS approved,
             COUNT(*) FILTER (WHERE status = 'Paid') AS paid,
             COUNT(*) FILTER (WHERE status IN ('Draft', 'Submitted')) AS draft,
             COALESCE(SUM(retention_amount), 0) AS retention_value
      FROM ra_bills
    `).catch(() => ({ rows: [{ total_bills: 0, approved: 0, paid: 0, draft: 0, retention_value: 0 }] })),
    query(`SELECT t.*, e.name as assignee_name FROM tickets t LEFT JOIN employees e ON t.assignee_id = e.id ORDER BY t.created_at DESC LIMIT 15`).catch(() => ({ rows: [] }))
  ]);

  return {
    total_employees : Number(employees.rows[0].total_employees || 0),
    total_assets    : Number(assets.rows[0].total_assets || 0),
    amc_count       : Number(amcCount.rows[0].active_amc || 0),
    payroll_volume  : Number(payrollVolume.rows[0].total_payroll || 0),
    revenue_target  : Number(revenueTarget.rows[0].total_revenue || 0),
    overdue_count   : Number(overdueCount.rows[0].overdue || 0),
    amc_expiring_soon : amcExpiringSoon.rows.map(r => ({ ...r, amcName: r.amc_name, amcNumber: r.amc_number, endDate: r.end_date })),
    revenue_snapshot  : {
      total: Number(revenueSnapshot.rows[0].total_bills || 0),
      approved: Number(revenueSnapshot.rows[0].approved || 0),
      paid: Number(revenueSnapshot.rows[0].paid || 0),
      draft: Number(revenueSnapshot.rows[0].draft || 0),
      retentionValue: Number(revenueSnapshot.rows[0].retention_value || 0)
    },
    recent_tickets: tickets.rows.map(r => ({ ...r, assigneeName: r.assignee_name }))
  };
};

/* ─── Charts ─────────────────────────────────────────────────── */
const getCharts = async () => {
  const revenueRes = await query(`
    SELECT DATE_TRUNC('month', bill_date) AS month,
           SUM(total_invoice_value)       AS revenue
    FROM ra_bills
    WHERE bill_date >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', bill_date)
    ORDER BY month
  `).catch(() => ({ rows: [] }));

  const attendanceTrendRes = await query(`
    SELECT date,
           COUNT(*) FILTER (WHERE status IN ('Present','WFH','Late')) AS present,
           COUNT(*) FILTER (WHERE status = 'Absent')                  AS absent
    FROM attendance
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY date ORDER BY date
  `).catch(() => ({ rows: [] }));

  return {
    revenue_chart    : revenueRes.rows,
    attendance_trend : attendanceTrendRes.rows,
  };
};

/* ─── Recent Activity ────────────────────────────────────────── */
const getRecentActivity = async (limit = 20) => {
  const { rows } = await query(
    `SELECT action, resource_type, resource_id, created_at, user_name
       FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1`,
    [limit]
  );
  return rows;
};

module.exports = { getSummary, getCharts, getRecentActivity };
