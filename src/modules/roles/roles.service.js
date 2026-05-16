'use strict';
const model = require('./roles.model');

const listRoles = () => model.listRoles();
const getRole = (id) => model.findById(id);
const createRole = (data) => model.createRole(data);
const updateRole = (id, data) => model.updateRole(id, data);
const deleteRole = (id) => model.deleteRole(id);
const updatePermissions = (id, permissions) => model.updatePermissions(id, permissions);

module.exports = { listRoles, getRole, createRole, updateRole, deleteRole, updatePermissions };
