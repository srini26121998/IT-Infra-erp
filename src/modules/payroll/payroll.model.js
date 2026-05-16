'use strict';

/**
 * Payroll — Data Access Layer
 * Covers payroll_records, payroll_configs, employee_payroll_maps,
 * salary_structures, and timesheets.
 */

const { query } = require('../../db/pool');

// ─────────────────────────────────────────────────────────────
// Payroll Records
// ─────────────────────────────────────────────────────────────

/**
 * List payroll records for a month/year — spec JOIN query.
 */
const listRecords = async ({ month, year, companyId, search, page, limit }) => {
  const offset = (page - 1) * limit;
  const searchTerm = search ? `%${search}%` : null;

  const dataRes = await query(
    `SELECT pr.*, e.name AS employee_name, e.employee_id AS emp_code
       FROM payroll_records pr
       JOIN employees e ON e.id = pr.employee_id
      WHERE ($1::varchar IS NULL OR pr.month = $1)
        AND ($2::int     IS NULL OR pr.year  = $2)
        AND ($3::varchar IS NULL OR pr.company_id = $3)
        AND ($4::varchar IS NULL OR e.name ILIKE $4 OR e.employee_id ILIKE $4)
      ORDER BY e.name
      LIMIT $5 OFFSET $6`,
    [month || null, year ? Number(year) : null, companyId || null, searchTerm, limit, offset]
  );

  const countRes = await query(
    `SELECT COUNT(*) FROM payroll_records pr
       JOIN employees e ON e.id = pr.employee_id
      WHERE ($1::varchar IS NULL OR pr.month = $1)
        AND ($2::int     IS NULL OR pr.year  = $2)
        AND ($3::varchar IS NULL OR pr.company_id = $3)
        AND ($4::varchar IS NULL OR e.name ILIKE $4 OR e.employee_id ILIKE $4)`,
    [month || null, year ? Number(year) : null, companyId || null, searchTerm]
  );

  return { rows: dataRes.rows, total: Number(countRes.rows[0].count) };
};

/** Get single payroll record with employee name. */
const findRecordById = async (id) => {
  const { rows } = await query(
    `SELECT pr.*, e.name AS employee_name, e.employee_id AS emp_code
       FROM payroll_records pr
       JOIN employees e ON e.id = pr.employee_id
      WHERE pr.id = $1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Upsert payroll record — spec INSERT ... ON CONFLICT.
 * id pattern: PAY-{empCode}-{Month}-{Year}
 */
const upsertRecord = async (data) => {
  const {
    id, employeeId, companyId, month, year,
    basic, hra, conveyance, da, medical, otherAllowances, grossSalary,
    lopDays, lopAmount, pf, esi, pt, tds, totalDeductions, netSalary,
    attendance, status, processedDate,
  } = data;

  const { rows } = await query(
    `INSERT INTO payroll_records
       (id, employee_id, company_id, month, year,
        basic, hra, conveyance, da, medical, other_allowances, gross_salary,
        lop_days, lop_amount, pf, esi, pt, tds, total_deductions, net_salary,
        attendance, status, processed_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,CURRENT_DATE)
     ON CONFLICT (id) DO UPDATE SET
       gross_salary     = EXCLUDED.gross_salary,
       net_salary       = EXCLUDED.net_salary,
       total_deductions = EXCLUDED.total_deductions,
       status           = EXCLUDED.status,
       updated_at       = NOW()
     RETURNING *`,
    [
      id, employeeId, companyId || null, month, year,
      basic || 0, hra || 0, conveyance || 0, da || 0, medical || 0,
      otherAllowances || 0, grossSalary || 0,
      lopDays || 0, lopAmount || 0, pf || 0, esi || 0, pt || 0, tds || 0,
      totalDeductions || 0, netSalary || 0,
      attendance ? JSON.stringify(attendance) : '{}',
      status || 'Draft',
    ]
  );
  return rows[0];
};

/** Full update of a payroll record. */
const updateRecord = async (id, data) => {
  const {
    basic, hra, conveyance, da, medical, otherAllowances, grossSalary,
    lopDays, lopAmount, pf, esi, pt, tds, totalDeductions, netSalary, status,
  } = data;

  const { rows } = await query(
    `UPDATE payroll_records
        SET basic          = $2, hra              = $3,
            conveyance     = $4, da               = $5,
            medical        = $6, other_allowances = $7,
            gross_salary   = $8, lop_days         = $9,
            lop_amount     = $10, pf              = $11,
            esi            = $12, pt              = $13,
            tds            = $14, total_deductions= $15,
            net_salary     = $16, status          = $17,
            updated_at     = NOW()
      WHERE id = $1
      RETURNING *`,
    [id, basic || 0, hra || 0, conveyance || 0, da || 0, medical || 0,
     otherAllowances || 0, grossSalary || 0, lopDays || 0, lopAmount || 0,
     pf || 0, esi || 0, pt || 0, tds || 0, totalDeductions || 0, netSalary || 0,
     status || 'Draft']
  );
  return rows[0] || null;
};

/** Soft delete payroll record. */
const deleteRecord = async (id) => {
  const { rowCount } = await query('DELETE FROM payroll_records WHERE id = $1', [id]);
  return rowCount > 0;
};

/** Mark bulk payroll as Paid — spec UPDATE. */
const markBulkPaid = async (month, year, companyId) => {
  const { rowCount } = await query(
    `UPDATE payroll_records
        SET status = 'Paid', updated_at = NOW()
      WHERE month = $1 AND year = $2
        AND ($3::varchar IS NULL OR company_id = $3)`,
    [month, year, companyId || null]
  );
  return rowCount;
};

// ─────────────────────────────────────────────────────────────
// Payroll Configs
// ─────────────────────────────────────────────────────────────

const listConfigs = async () => {
  const { rows } = await query('SELECT * FROM payroll_configs ORDER BY created_at');
  return rows;
};

const findConfigByCompany = async (companyId) => {
  const { rows } = await query(
    'SELECT * FROM payroll_configs WHERE company_id = $1',
    [companyId]
  );
  return rows[0] || null;
};

const upsertConfig = async (companyId, data) => {
  const {
    payCycle, calculationBasis, pfEnabled, pfRate, pfEmployerRate,
    esiEnabled, esiRate, esiEmployerRate, ptEnabled, tdsEnabled, salaryComponents,
  } = data;

  const { rows } = await query(
    `INSERT INTO payroll_configs
       (company_id, pay_cycle, calculation_basis,
        pf_enabled, pf_rate, pf_employer_rate,
        esi_enabled, esi_rate, esi_employer_rate,
        pt_enabled, tds_enabled, salary_components)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (company_id) DO UPDATE SET
       pay_cycle           = EXCLUDED.pay_cycle,
       calculation_basis   = EXCLUDED.calculation_basis,
       pf_enabled          = EXCLUDED.pf_enabled,
       pf_rate             = EXCLUDED.pf_rate,
       pf_employer_rate    = EXCLUDED.pf_employer_rate,
       esi_enabled         = EXCLUDED.esi_enabled,
       esi_rate            = EXCLUDED.esi_rate,
       esi_employer_rate   = EXCLUDED.esi_employer_rate,
       pt_enabled          = EXCLUDED.pt_enabled,
       tds_enabled         = EXCLUDED.tds_enabled,
       salary_components   = EXCLUDED.salary_components,
       updated_at          = NOW()
     RETURNING *`,
    [
      companyId, payCycle || 'Monthly', calculationBasis || 'WorkingDays',
      pfEnabled !== undefined ? pfEnabled : true,
      pfRate || 12, pfEmployerRate || 12,
      esiEnabled !== undefined ? esiEnabled : true,
      esiRate || 0.75, esiEmployerRate || 3.25,
      ptEnabled !== undefined ? ptEnabled : true,
      tdsEnabled || false,
      JSON.stringify(salaryComponents || []),
    ]
  );
  return rows[0];
};

// ─────────────────────────────────────────────────────────────
// Salary Structures
// ─────────────────────────────────────────────────────────────

const listStructures = async (companyId) => {
  const { rows } = await query(
    `SELECT * FROM salary_structures
      WHERE ($1::varchar IS NULL OR company_id = $1)
      ORDER BY created_at`,
    [companyId || null]
  );
  return rows;
};

const createStructure = async ({ name, companyId, components, isDefault }) => {
  const { rows } = await query(
    `INSERT INTO salary_structures (name, company_id, components, is_default)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, companyId || null, JSON.stringify(components || {}), isDefault || false]
  );
  return rows[0];
};

// ─────────────────────────────────────────────────────────────
// Employee Payroll Maps
// ─────────────────────────────────────────────────────────────

const listEmployeeMaps = async (companyId) => {
  const { rows } = await query(
    `SELECT m.*, e.name AS employee_name, e.employee_id AS emp_code
       FROM employee_payroll_maps m
       JOIN employees e ON e.id = m.employee_id
      WHERE ($1::varchar IS NULL OR m.company_id = $1)
      ORDER BY e.name`,
    [companyId || null]
  );
  return rows;
};

const findEmployeeMap = async (employeeId) => {
  const { rows } = await query(
    `SELECT m.*, e.name AS employee_name, e.employee_id AS emp_code
       FROM employee_payroll_maps m
       JOIN employees e ON e.id = m.employee_id
      WHERE m.employee_id = $1`,
    [employeeId]
  );
  return rows[0] || null;
};

const upsertEmployeeMap = async (employeeId, data) => {
  const {
    companyId, pfNumber, esiNumber, bankAccount, bankName, ifscCode,
    baseSalary, componentOverrides,
  } = data;

  const { rows } = await query(
    `INSERT INTO employee_payroll_maps
       (employee_id, company_id, pf_number, esi_number, bank_account, bank_name,
        ifsc_code, base_salary, component_overrides)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (employee_id) DO UPDATE SET
       company_id          = EXCLUDED.company_id,
       pf_number           = EXCLUDED.pf_number,
       esi_number          = EXCLUDED.esi_number,
       bank_account        = EXCLUDED.bank_account,
       bank_name           = EXCLUDED.bank_name,
       ifsc_code           = EXCLUDED.ifsc_code,
       base_salary         = EXCLUDED.base_salary,
       component_overrides = EXCLUDED.component_overrides,
       updated_at          = NOW()
     RETURNING *`,
    [
      employeeId, companyId || null, pfNumber || null, esiNumber || null,
      bankAccount || null, bankName || null, ifscCode || null,
      baseSalary || 0, JSON.stringify(componentOverrides || {}),
    ]
  );
  return rows[0];
};

// ─────────────────────────────────────────────────────────────
// Timesheets
// ─────────────────────────────────────────────────────────────

const listTimesheets = async ({ employeeId, month, year, status, page, limit }) => {
  const offset = (page - 1) * limit;
  const { rows } = await query(
    `SELECT t.*, e.name AS employee_name
       FROM timesheets t
       JOIN employees e ON e.id = t.employee_id
      WHERE ($1::uuid IS NULL OR t.employee_id = $1)
        AND ($2::int   IS NULL OR EXTRACT(MONTH FROM t.work_date) = $2)
        AND ($3::int   IS NULL OR EXTRACT(YEAR  FROM t.work_date) = $3)
        AND ($4::text  IS NULL OR t.status = $4)
      ORDER BY t.work_date DESC
      LIMIT $5 OFFSET $6`,
    [employeeId || null, month ? Number(month) : null, year ? Number(year) : null,
     status || null, limit, offset]
  );
  return rows;
};

/** Timesheet summary for payroll calculation — spec query. */
const timesheetSummary = async (month, year) => {
  const { rows } = await query(
    `SELECT employee_id, SUM(hours_worked) AS total_hours
       FROM timesheets
      WHERE EXTRACT(MONTH FROM work_date) = $1
        AND EXTRACT(YEAR  FROM work_date) = $2
        AND status = 'Approved'
      GROUP BY employee_id`,
    [month, year]
  );
  return rows;
};

const createTimesheet = async ({ employeeId, projectId, amcId, workDate, hoursWorked, description }) => {
  const { rows } = await query(
    `INSERT INTO timesheets (employee_id, project_id, amc_id, work_date, hours_worked, description)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [employeeId, projectId || null, amcId || null, workDate, hoursWorked, description || null]
  );
  return rows[0];
};

const approveTimesheet = async (id, approvedBy) => {
  const { rows } = await query(
    `UPDATE timesheets
        SET status = 'Approved', approved_by = $2, approved_at = NOW()
      WHERE id = $1
      RETURNING *`,
    [id, approvedBy]
  );
  return rows[0] || null;
};

module.exports = {
  // Payroll records
  listRecords, findRecordById, upsertRecord, updateRecord, deleteRecord, markBulkPaid,
  // Configs
  listConfigs, findConfigByCompany, upsertConfig,
  // Salary structures
  listStructures, createStructure,
  // Employee maps
  listEmployeeMaps, findEmployeeMap, upsertEmployeeMap,
  // Timesheets
  listTimesheets, timesheetSummary, createTimesheet, approveTimesheet,
};
