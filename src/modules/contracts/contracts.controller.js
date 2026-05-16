'use strict';
const svc = require('./contracts.service');
const { success } = require('../../utils/response');

const listContracts = async (req, res, next) => {
  try { return success(res, await svc.listContracts(req.query)); } catch (e) { next(e); }
};
const getContract = async (req, res, next) => {
  try {
    const contract = await svc.getContract(req.params.id);
    if (!contract) throw Object.assign(new Error('Contract not found'), { status: 404 });
    return success(res, contract);
  } catch (e) { next(e); }
};
const createContract = async (req, res, next) => {
  try { return success(res, await svc.createContract(req.body), 'Contract created', 201); } catch (e) { next(e); }
};
const updateContract = async (req, res, next) => {
  try { return success(res, await svc.updateContract(req.params.id, req.body), 'Contract updated'); } catch (e) { next(e); }
};
const advanceStatus = async (req, res, next) => {
  try { return success(res, await svc.advanceStatus(req.params.id, req.body.status), 'Status advanced'); } catch (e) { next(e); }
};
const deleteContract = async (req, res, next) => {
  try { await svc.deleteContract(req.params.id); return success(res, null, 'Contract deleted'); } catch (e) { next(e); }
};

module.exports = { listContracts, getContract, createContract, updateContract, advanceStatus, deleteContract };
