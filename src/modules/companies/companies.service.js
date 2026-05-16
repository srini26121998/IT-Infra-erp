'use strict';
const model = require('./companies.model');

const listCompanies = (params) => model.listCompanies(params);
const getCompany = (id) => model.findById(id);
const createCompany = (data) => model.createCompany(data);
const updateCompany = (id, data) => model.updateCompany(id, data);
const patchStatus = (id, status) => model.patchStatus(id, status);
const deleteCompany = (id) => model.softDelete(id);

module.exports = { listCompanies, getCompany, createCompany, updateCompany, patchStatus, deleteCompany };
