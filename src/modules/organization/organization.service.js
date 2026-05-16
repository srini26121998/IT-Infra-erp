'use strict';
const model = require('./organization.model');

const listDepartments = () => model.listDepartments();
const createDepartment = (data) => model.createDepartment(data);
const updateDepartment = (id, data) => model.updateDepartment(id, data);
const deleteDepartment = async (id) => {
  const success = await model.softDeleteDepartment(id);
  if (!success) throw Object.assign(new Error('Cannot delete department with active employees or not found'), { status: 400 });
};

const listDesignations = () => model.listDesignations();
const createDesignation = (data) => model.createDesignation(data);
const updateDesignation = (id, data) => model.updateDesignation(id, data);
const deleteDesignation = (id) => model.softDeleteDesignation(id);

module.exports = {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  listDesignations, createDesignation, updateDesignation, deleteDesignation
};
