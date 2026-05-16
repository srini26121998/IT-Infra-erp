'use strict';
const svc = require('./companies.service');
const { success } = require('../../utils/response');

const listCompanies = async (req, res, next) => {
  try { return success(res, await svc.listCompanies(req.query)); } catch (e) { next(e); }
};
const getCompany = async (req, res, next) => {
  try {
    const company = await svc.getCompany(req.params.id);
    if (!company) throw Object.assign(new Error('Company not found'), { status: 404 });
    return success(res, company);
  } catch (e) { next(e); }
};
const createCompany = async (req, res, next) => {
  try { return success(res, await svc.createCompany(req.body), 'Company created', 201); } catch (e) { next(e); }
};
const updateCompany = async (req, res, next) => {
  try { return success(res, await svc.updateCompany(req.params.id, req.body), 'Company updated'); } catch (e) { next(e); }
};
const patchStatus = async (req, res, next) => {
  try { return success(res, await svc.patchStatus(req.params.id, req.body.status), 'Status updated'); } catch (e) { next(e); }
};
const deleteCompany = async (req, res, next) => {
  try { await svc.deleteCompany(req.params.id); return success(res, null, 'Company deleted'); } catch (e) { next(e); }
};

module.exports = { listCompanies, getCompany, createCompany, updateCompany, patchStatus, deleteCompany };
