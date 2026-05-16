'use strict';
const svc = require('./reports.service');
const { success } = require('../../utils/response');

const listTypes = async (req, res, next) => {
  try {
    return success(res, [
      { id: 'employee',       name: 'Employee Master Report', fields: ['startDate', 'endDate'] },
      { id: 'attendance',     name: 'Daily Attendance Report', fields: ['startDate', 'endDate'] },
      { id: 'payroll',        name: 'Monthly Payroll Summary', fields: ['year', 'month'] },
      { id: 'contracts',      name: 'Client Contracts Overview', fields: ['startDate'] },
      { id: 'company',        name: 'Company Directory', fields: [] },
      { id: 'companyAssets',  name: 'Company Assets Registry', fields: [] },
      { id: 'employeeAssets', name: 'Asset Allocations', fields: [] },
      { id: 'subscription',   name: 'Software Subscriptions', fields: [] },
      { id: 'raBilling',      name: 'Revenue Assurance Billing', fields: [] },
      { id: 'amcContract',    name: 'AMC Contracts', fields: [] },
      { id: 'revenue',        name: 'Total Revenue Data', fields: [] }
    ]);
  } catch (e) { next(e); }
};

const getReport = async (req, res, next) => {
  try {
    const { type, ...params } = req.query;
    return success(res, await svc.getReportData(type, params));
  } catch (e) { next(e); }
};

/**
 * Export report data as CSV for download.
 * GET /v1/reports/export?type=employee&startDate=...&endDate=...
 */
const exportReport = async (req, res, next) => {
  try {
    const { type, ...params } = req.query;
    if (!type) {
      return res.status(400).json({ success: false, message: 'Report type is required' });
    }

    const data = await svc.getReportData(type, params);

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'No data found for this report' });
    }

    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          // Wrap in quotes if contains comma, newline, or double-quote
          return /[,\n"]/.test(str) ? `"${str}"` : str;
        }).join(',')
      )
    ];
    const csvContent = csvRows.join('\n');

    const filename = `${type}_report_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (e) { next(e); }
};

module.exports = { listTypes, getReport, exportReport };
