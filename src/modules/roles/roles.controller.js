'use strict';
const svc = require('./roles.service');
const { success } = require('../../utils/response');

const listRoles = async (req, res, next) => {
  try { return success(res, await svc.listRoles()); } catch (e) { next(e); }
};
const getRole = async (req, res, next) => {
  try { return success(res, await svc.getRole(req.params.id)); } catch (e) { next(e); }
};
const createRole = async (req, res, next) => {
  try { return success(res, await svc.createRole(req.body), 'Role created', 201); } catch (e) { next(e); }
};
const updateRole = async (req, res, next) => {
  try { return success(res, await svc.updateRole(req.params.id, req.body), 'Role updated'); } catch (e) { next(e); }
};
const deleteRole = async (req, res, next) => {
  try { return success(res, await svc.deleteRole(req.params.id), 'Role deleted'); } catch (e) { next(e); }
};
const updatePermissions = async (req, res, next) => {
  try { return success(res, await svc.updatePermissions(req.params.id, req.body.permissions), 'Permissions updated'); } catch (e) { next(e); }
};

module.exports = { listRoles, getRole, createRole, updateRole, deleteRole, updatePermissions };
