'use strict';
const model = require('./reports.model');

const getReportData = async (type, params) => {
  switch (type.toLowerCase()) {
    case 'employee':   return model.getEmployeeReport(params);
    case 'attendance': return model.getAttendanceReport(params);
    case 'payroll':    return model.getPayrollReport(params);
    case 'salary':     return model.getPayrollReport(params);
    case 'contracts':  return model.getContractsReport(params);
    case 'company':    return model.getCompaniesReport();
    case 'companyassets': return model.getCompanyAssetsReport();
    case 'employeeassets': return model.getEmployeeAssetsReport();
    case 'subscription': return model.getSubscriptionsReport();
    case 'rabilling':    return model.getRABillingReport();
    case 'amccontract':  return model.getAMCContractsReport();
    case 'revenue':      return model.getRevenueReport();
    default: throw Object.assign(new Error(`Invalid report type: ${type}`), { status: 400 });
  }
};

module.exports = { getReportData };
