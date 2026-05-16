'use strict';
const svc = require('./organization.service');
const { success } = require('../../utils/response');

// Departments
const listDepartments = async (req, res, next) => {
  try { return success(res, await svc.listDepartments()); } catch (e) { next(e); }
};
const createDepartment = async (req, res, next) => {
  try { return success(res, await svc.createDepartment(req.body), 'Department created', 201); } catch (e) { next(e); }
};
const updateDepartment = async (req, res, next) => {
  try { return success(res, await svc.updateDepartment(req.params.id, req.body), 'Department updated'); } catch (e) { next(e); }
};
const deleteDepartment = async (req, res, next) => {
  try { await svc.deleteDepartment(req.params.id); return success(res, null, 'Department deleted'); } catch (e) { next(e); }
};

// Designations
const listDesignations = async (req, res, next) => {
  try { return success(res, await svc.listDesignations()); } catch (e) { next(e); }
};
const createDesignation = async (req, res, next) => {
  try { return success(res, await svc.createDesignation(req.body), 'Designation created', 201); } catch (e) { next(e); }
};
const updateDesignation = async (req, res, next) => {
  try { return success(res, await svc.updateDesignation(req.params.id, req.body), 'Designation updated'); } catch (e) { next(e); }
};
const deleteDesignation = async (req, res, next) => {
  try { await svc.deleteDesignation(req.params.id); return success(res, null, 'Designation deleted'); } catch (e) { next(e); }
};

module.exports = {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  listDesignations, createDesignation, updateDesignation, deleteDesignation
};
