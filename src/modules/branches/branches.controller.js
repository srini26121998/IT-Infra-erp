'use strict';
const svc = require('./branches.service');
const { success } = require('../../utils/response');

const listBranches = async (req, res, next) => {
  try { return success(res, await svc.listBranches(req.query)); } catch (e) { next(e); }
};
const getBranch = async (req, res, next) => {
  try { return success(res, await svc.getBranch(req.params.id)); } catch (e) { next(e); }
};
const createBranch = async (req, res, next) => {
  try { return success(res, await svc.createBranch(req.body), 'Branch created', 201); } catch (e) { next(e); }
};
const updateBranch = async (req, res, next) => {
  try { return success(res, await svc.updateBranch(req.params.id, req.body), 'Branch updated'); } catch (e) { next(e); }
};
const deleteBranch = async (req, res, next) => {
  try { await svc.deleteBranch(req.params.id); return success(res, null, 'Branch deleted'); } catch (e) { next(e); }
};

module.exports = { listBranches, getBranch, createBranch, updateBranch, deleteBranch };
