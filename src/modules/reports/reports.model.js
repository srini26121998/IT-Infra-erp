'use strict';
const { query } = require('../../db/pool');

const getEmployeeReport = async ({ startDate, endDate }) => {
  const { rows } = await query(`
    SELECT e.employee_id, e.name, e.email, e.phone_number, e.role,
           d.name AS department, e.join_date, e.status, e.gross_salary
    FROM employees e
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE e.deleted_at IS NULL
    AND ($1::DATE IS NULL OR e.join_date >= $1)
    AND ($2::DATE IS NULL OR e.join_date <= $2)
    ORDER BY e.name;
  `, [startDate, endDate]);
  return rows;
};

const getAttendanceReport = async ({ startDate, endDate }) => {
  const { rows } = await query(`
    SELECT a.date, e.name, e.employee_id AS emp_code, a.check_in, a.check_out,
           a.status, a.is_late, a.is_wfh, a.is_half_day, a.admin_status
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE ($1::DATE IS NULL OR a.date >= $1)
    AND ($2::DATE IS NULL OR a.date <= $2)
    ORDER BY a.date DESC, e.name;
  `, [startDate, endDate]);
  return rows;
};

const getPayrollReport = async ({ year, month }) => {
  const { rows } = await query(`
    SELECT pr.month, pr.year, e.name, e.employee_id AS emp_code,
           pr.gross_salary, pr.total_deductions, pr.net_salary, pr.status
    FROM payroll_records pr
    JOIN employees e ON e.id = pr.employee_id
    WHERE ($1::INTEGER IS NULL OR pr.year = $1)
    AND ($2::TEXT IS NULL OR pr.month = $2)
    ORDER BY pr.year DESC, pr.month, e.name;
  `, [year, month]);
  return rows;
};

const getContractsReport = async ({ startDate }) => {
  const { rows } = await query(`
    SELECT contract_number, contract_name, contract_type, client,
           contract_value, start_date, end_date, status
    FROM contracts
    WHERE deleted_at IS NULL
    AND ($1::DATE IS NULL OR contract_date >= $1)
    ORDER BY contract_date DESC;
  `, [startDate]);
  return rows;
};

const getCompaniesReport = async () => {
  const { rows } = await query('SELECT * FROM companies WHERE deleted_at IS NULL ORDER BY name');
  return rows;
};

const getCompanyAssetsReport = async () => {
  const { rows } = await query('SELECT * FROM company_assets WHERE deleted_at IS NULL ORDER BY created_at DESC');
  return rows;
};

const getEmployeeAssetsReport = async () => {
  const { rows } = await query(`
    SELECT ea.*, e.name AS employee_name, e.employee_id AS emp_code
    FROM employee_assets ea
    JOIN employees e ON e.id = ea.employee_id
    WHERE ea.deleted_at IS NULL
    ORDER BY ea.distributed_on DESC;
  `);
  return rows;
};

const getSubscriptionsReport = async () => {
  const { rows } = await query('SELECT * FROM subscriptions WHERE deleted_at IS NULL ORDER BY end_date ASC');
  return rows;
};

const getRABillingReport = async () => {
  const { rows } = await query('SELECT * FROM ra_bills WHERE deleted_at IS NULL ORDER BY bill_date DESC');
  return rows;
};

const getAMCContractsReport = async () => {
  const { rows } = await query('SELECT * FROM amc_contracts WHERE deleted_at IS NULL ORDER BY start_date DESC');
  return rows;
};

const getRevenueReport = async () => {
  const { rows } = await query(`
    SELECT 
      DATE_TRUNC('month', bill_date) AS period,
      SUM(gross_amount) AS total_gross,
      SUM(retention_amount) AS total_retention,
      SUM(total_invoice_value) AS total_revenue,
      COUNT(*) AS bill_count
    FROM ra_bills
    WHERE deleted_at IS NULL
    GROUP BY 1
    ORDER BY 1 DESC
  `);
  return rows;
};

module.exports = { 
  getEmployeeReport, getAttendanceReport, getPayrollReport, getContractsReport,
  getCompaniesReport, getCompanyAssetsReport, getEmployeeAssetsReport, 
  getSubscriptionsReport, getRABillingReport, getAMCContractsReport, getRevenueReport
};
