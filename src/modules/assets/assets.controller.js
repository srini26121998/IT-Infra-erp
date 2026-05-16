'use strict';
const svc = require('./assets.service');
const { success } = require('../../utils/response');

// Employee Assets
const listEmployeeAssets = async (req, res, next) => {
  try { return success(res, await svc.listEmployeeAssets(req.query.employeeId)); } catch (e) { next(e); }
};
const allocateAsset = async (req, res, next) => {
  try { return success(res, await svc.allocateAsset(req.body), 'Asset allocated', 201); } catch (e) { next(e); }
};
const updateAllocation = async (req, res, next) => {
  try { return success(res, await svc.updateAllocation(req.params.id, req.body), 'Allocation updated'); } catch (e) { next(e); }
};
const deleteAllocation = async (req, res, next) => {
  try { await svc.deleteAllocation(req.params.id); return success(res, null, 'Allocation removed'); } catch (e) { next(e); }
};
const getEmployeeAssetById = async (req, res, next) => {
  try { return success(res, await svc.getEmployeeAssetById(req.params.id)); } catch (e) { next(e); }
};
const getAssetHistory = async (req, res, next) => {
  try { return success(res, await svc.getAssetHistory(req.params.id)); } catch (e) { next(e); }
};

// Company Assets
const listCompanyAssets = async (req, res, next) => {
  try { return success(res, await svc.listCompanyAssets(req.query)); } catch (e) { next(e); }
};
const addCompanyAsset = async (req, res, next) => {
  try { return success(res, await svc.addCompanyAsset(req.body), 'Company asset added', 201); } catch (e) { next(e); }
};
const updateCompanyAsset = async (req, res, next) => {
  try { return success(res, await svc.updateCompanyAsset(req.params.id, req.body), 'Company asset updated'); } catch (e) { next(e); }
};
const deleteCompanyAsset = async (req, res, next) => {
  try { await svc.deleteCompanyAsset(req.params.id); return success(res, null, 'Company asset deleted'); } catch (e) { next(e); }
};
const getCompanyAssetById = async (req, res, next) => {
  try { return success(res, await svc.getCompanyAssetById(req.params.id)); } catch (e) { next(e); }
};
const deactivateCompanyAsset = async (req, res, next) => {
  try { await svc.deactivateCompanyAsset(req.params.id); return success(res, null, 'Asset deactivated'); } catch (e) { next(e); }
};

// Asset Maintenance
const listMaintenanceLogs = async (req, res, next) => {
  try { return success(res, await svc.listMaintenanceLogs()); } catch (e) { next(e); }
};
const addMaintenanceLog = async (req, res, next) => {
  try { return success(res, await svc.addMaintenanceLog(req.body), 'Maintenance log added', 201); } catch (e) { next(e); }
};
const updateMaintenanceLog = async (req, res, next) => {
  try { return success(res, await svc.updateMaintenanceLog(req.params.id, req.body), 'Maintenance log updated'); } catch (e) { next(e); }
};
const deleteMaintenanceLog = async (req, res, next) => {
  try { await svc.deleteMaintenanceLog(req.params.id); return success(res, null, 'Maintenance log deleted'); } catch (e) { next(e); }
};

// Asset Audits
const listAuditLogs = async (req, res, next) => {
  try { return success(res, await svc.listAuditLogs()); } catch (e) { next(e); }
};
const createAuditEntry = async (req, res, next) => {
  try { return success(res, await svc.recordAudit({ ...req.body, performedBy: req.user.id }), 'Audit entry created', 201); } catch (e) { next(e); }
};

module.exports = {
  listEmployeeAssets, allocateAsset, updateAllocation, deleteAllocation, getEmployeeAssetById, getAssetHistory,
  listCompanyAssets, addCompanyAsset, updateCompanyAsset, deleteCompanyAsset, getCompanyAssetById, deactivateCompanyAsset,
  listMaintenanceLogs, addMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog,
  listAuditLogs, createAuditEntry
};
