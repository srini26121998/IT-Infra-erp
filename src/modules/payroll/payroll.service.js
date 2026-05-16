'use strict';

/**
 * Payroll — Service Layer
 * Bulk processing, payslip generation, timesheet summary for payroll.
 */

const model = require('./payroll.model');
const attendanceModel = require('../attendance/attendance.model');
const { query } = require('../../db/pool');

/** Normalize snake_case payload from frontend to camelCase. */
const normalizeRecord = async (data) => {
  const normalized = {
    id: data.id || `PAY-${data.employee_id || data.employeeId}-${data.month}-${data.year}`,
    employeeId: data.employee_id || data.employeeId,
    companyId: data.company_id || data.companyId,
    month: data.month,
    year: data.year,
    basic: data.basic,
    hra: data.hra,
    conveyance: data.conveyance,
    da: data.da,
    medical: data.medical,
    otherAllowances: data.other_allowances || data.otherAllowances,
    grossSalary: data.gross_salary || data.grossSalary,
    lopDays: data.lop_days || data.lopDays,
    lopAmount: data.lop_amount || data.lopAmount,
    pf: data.pf,
    esi: data.esi,
    pt: data.pt,
    tds: data.tds,
    totalDeductions: data.total_deductions || data.totalDeductions,
    netSalary: data.net_salary || data.netSalary,
    attendance: data.attendance,
    status: data.status || 'Draft'
  };

  // Resolve employee code (e.g. EMP-0004) to UUID if needed
  if (normalized.employeeId) {
    const { rows } = await query(
      'SELECT id FROM employees WHERE employee_id = $1 OR id::text = $1 LIMIT 1',
      [normalized.employeeId]
    );
    if (rows[0]) normalized.employeeId = rows[0].id;
  }

  // Handle stringified attendance
  if (typeof normalized.attendance === 'string') {
    try {
      normalized.attendance = JSON.parse(normalized.attendance);
    } catch (e) {
      normalized.attendance = {};
    }
  }

  return normalized;
};

// ─────────────────────────────────────────────────────────────
// Payroll Records
// ─────────────────────────────────────────────────────────────

const listRecords = ({ month, year, companyId, search, page = 1, limit = 20 }) =>
  model.listRecords({ month, year, companyId, search, page: +page, limit: +limit });

const getRecord = async (id) => {
  const rec = await model.findRecordById(id);
  if (!rec) throw Object.assign(new Error('Payroll record not found'), { status: 404 });
  return rec;
};

/** Get payslip — same data as getRecord but future-proof for PDF generation. */
const getPayslip = async (id) => {
  const rec = await model.findRecordById(id);
  if (!rec) throw Object.assign(new Error('Payslip not found'), { status: 404 });
  return rec;
};

/** Create/save individual payroll record. */
const createRecord = async (data) => {
  const normalized = await normalizeRecord(data);
  const result = await model.upsertRecord(normalized);
  return model.findRecordById(result.id);
};

/** Update existing payroll record. */
const updateRecord = async (id, data) => {
  const normalized = await normalizeRecord({ ...data, id });
  const result = await model.updateRecord(id, normalized);
  if (!result) throw Object.assign(new Error('Payroll record not found'), { status: 404 });
  return model.findRecordById(id);
};

/** Delete a payroll record. */
const deleteRecord = async (id) => {
  const ok = await model.deleteRecord(id);
  if (!ok) throw Object.assign(new Error('Payroll record not found'), { status: 404 });
};

/**
 * Bulk process payroll for a month/year.
 * Calculates salary based on configs, maps, and attendance.
 */
const processPayroll = async ({ month, year, companyId }) => {
  if (!month || !year || !companyId) {
    throw Object.assign(new Error('month, year, and companyId are required'), { status: 400 });
  }

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  const monthIdx = typeof month === 'number' ? month : monthNames.indexOf(month) + 1;
  const monthName = monthNames[monthIdx - 1];

  // 1. Fetch Configs and Maps
  const config = await model.findConfigByCompany(companyId);
  if (!config) throw Object.assign(new Error(`No payroll config found for company ${companyId}`), { status: 404 });

  const employeeMaps = await model.listEmployeeMaps(companyId);
  const attendanceSummaries = await attendanceModel.getMonthlySummary(monthIdx, +year);

  // 2. Process each employee
  const results = await Promise.all(employeeMaps.map(async (map) => {
    const att = attendanceSummaries.find(a => a.employee_id === map.employee_id) || {
      present: 0, absent: 0, half_day: 0, wfh_days: 0
    };

    const ctc = Number(map.base_salary);
    let basic = 0, hra = 0, conveyance = 0, da = 0, medical = 0, otherAllowances = 0;
    let gross = 0;

    // Calculation Logic (mirroring frontend)
    const components = Array.isArray(config.salary_components) ? config.salary_components : [];
    
    components.forEach(comp => {
      let amount = 0;
      if (comp.calculationType === 'Percentage') {
        if (comp.id === 'BASIC') {
          amount = ctc * ((comp.percentageValue || 40) / 100);
          basic = amount;
        } else if (comp.id === 'HRA') {
          amount = basic * ((comp.percentageValue || 50) / 100);
          hra = amount;
        } else {
          amount = ctc * ((comp.percentageValue || 10) / 100);
        }
      } else {
        amount = Number(comp.fixedValue || 0);
      }

      if (comp.id === 'CON') conveyance = amount;
      if (comp.id === 'DA') da = amount;
      if (comp.id === 'MED') medical = amount;
      
      gross += amount;
    });

    // Remainder to other allowances if gross < ctc
    if (gross < ctc) {
      otherAllowances = ctc - gross;
      gross = ctc;
    }

    // Attendance & LOP
    const workingDays = 26; // Default or from config
    const payableDays = Number(att.present) + (Number(att.half_day) * 0.5);
    let lopAmount = 0;
    if (config.calculation_basis === 'WorkingDays') {
      const perDay = gross / workingDays;
      const lopDays = workingDays - payableDays;
      lopAmount = perDay * Math.max(0, lopDays);
    }

    // Statutory Deductions
    let pf = 0;
    if (config.pf_enabled) {
      pf = basic * (Number(config.pf_rate || 12) / 100);
    }
    let esi = 0;
    if (config.esi_enabled && gross <= 21000) {
      esi = gross * (Number(config.esi_rate || 0.75) / 100);
    }
    let pt = config.pt_enabled ? 200 : 0;
    let tds = 0; // Placeholder for TDS logic

    const totalDeductions = lopAmount + pf + esi + pt + tds;
    const netSalary = gross - totalDeductions;

    const id = `PAY-${map.emp_code}-${monthName}-${year}`;

    return model.upsertRecord({
      id,
      employeeId: map.employee_id,
      companyId,
      month: monthName,
      year: +year,
      basic, hra, conveyance, da, medical, otherAllowances,
      grossSalary: gross,
      lopDays: workingDays - payableDays,
      lopAmount,
      pf, esi, pt, tds,
      totalDeductions,
      netSalary,
      attendance: att,
      status: 'Processed'
    });
  }));

  return results;
};

// ─────────────────────────────────────────────────────────────
// Payroll Configs
// ─────────────────────────────────────────────────────────────

const listSettings = () => model.listConfigs();

const updateSettings = (companyId, data) => model.upsertConfig(companyId, data);

// ─────────────────────────────────────────────────────────────
// Salary Structures
// ─────────────────────────────────────────────────────────────

const listStructures  = (companyId) => model.listStructures(companyId);
const createStructure = (data)      => model.createStructure(data);

// ─────────────────────────────────────────────────────────────
// Employee Payroll Maps
// ─────────────────────────────────────────────────────────────

const listEmployeeMaps = (companyId) => model.listEmployeeMaps(companyId);
const getEmployeeMap  = (employeeId) => model.findEmployeeMap(employeeId);
const updateEmployeeMap = (employeeId, data) => model.upsertEmployeeMap(employeeId, data);

// ─────────────────────────────────────────────────────────────
// Timesheets
// ─────────────────────────────────────────────────────────────

const listTimesheets = async ({ employeeId, month, year, status, page = 1, limit = 20 }) => {
  let resolvedId = employeeId;
  
  // If employeeId is provided and NOT a UUID, try to resolve it
  if (employeeId && !employeeId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    const { rows } = await query(
      'SELECT id FROM employees WHERE employee_id = $1 LIMIT 1',
      [employeeId]
    );
    if (rows[0]) {
      resolvedId = rows[0].id;
    } else {
      // If emp_code provided but not found, return empty to avoid SQL cast error
      return [];
    }
  }

  return model.listTimesheets({ employeeId: resolvedId, month, year, status, page: +page, limit: +limit });
};

const submitTimesheet = (employeeId, data) =>
  model.createTimesheet({ employeeId, ...data });

const approveTimesheet = async (id, approverId) => {
  const rec = await model.approveTimesheet(id, approverId);
  if (!rec) throw Object.assign(new Error('Timesheet not found'), { status: 404 });
  return rec;
};

module.exports = {
  listRecords, getRecord, getPayslip, createRecord, updateRecord, deleteRecord, processPayroll,
  listSettings, updateSettings,
  listStructures, createStructure,
  listEmployeeMaps, getEmployeeMap, updateEmployeeMap,
  listTimesheets, submitTimesheet, approveTimesheet,
};
