'use strict';
const model = require('./assets.model');

const listEmployeeAssets = (employeeId) => model.listEmployeeAssets(employeeId);
const allocateAsset = (data) => model.allocateAsset(data);
const updateAllocation = (id, data) => model.updateAllocation(id, data);
const deleteAllocation = (id) => model.softDeleteAllocation(id);
const getEmployeeAssetById = (id) => model.getEmployeeAssetById(id);
const getAssetHistory = (assetId) => model.getAssetHistory(assetId);

const listCompanyAssets = (filters) => model.listCompanyAssets(filters);
const addCompanyAsset = (data) => model.addCompanyAsset(data);
const updateCompanyAsset = (id, data) => model.updateCompanyAsset(id, data);
const deleteCompanyAsset = (id) => model.softDeleteCompanyAsset(id);
const getCompanyAssetById = (id) => model.getCompanyAssetById(id);
const deactivateCompanyAsset = (id) => model.deactivateCompanyAsset(id);

const listMaintenanceLogs = () => model.listMaintenanceLogs();
const addMaintenanceLog = (data) => model.addMaintenanceLog(data);
const updateMaintenanceLog = (id, data) => model.updateMaintenanceLog(id, data);
const deleteMaintenanceLog = (id) => model.deleteMaintenanceLog(id);

// Audit Logs
const listAuditLogs = () => model.listAuditLogs();
const recordAudit = (data) => model.createAuditEntry(data);

module.exports = {
  listEmployeeAssets, allocateAsset, updateAllocation, deleteAllocation, getEmployeeAssetById, getAssetHistory,
  listCompanyAssets, addCompanyAsset, updateCompanyAsset, deleteCompanyAsset, getCompanyAssetById, deactivateCompanyAsset,
  listMaintenanceLogs, addMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog,
  listAuditLogs, recordAudit
};
