'use strict';
const svc = require('./revenue.service');
const { success } = require('../../utils/response');

const getSummary = async (req, res, next) => {
  try { return success(res, await svc.getDashboardSummary()); } catch (e) { next(e); }
};
const listBills = async (req, res, next) => {
  try { return success(res, await svc.listRaBills(req.query)); } catch (e) { next(e); }
};
const getBill = async (req, res, next) => {
  try { return success(res, await svc.getBillDetail(req.params.id)); } catch (e) { next(e); }
};
const createBill = async (req, res, next) => {
  try { return success(res, await svc.createBill(req.body), 'RA Bill created', 201); } catch (e) { next(e); }
};
const updateBill = async (req, res, next) => {
  try { return success(res, await svc.updateBill(req.params.id, req.body), 'RA Bill updated'); } catch (e) { next(e); }
};
const authorizeBill = async (req, res, next) => {
  try { return success(res, await svc.authorizeBill(req.params.id), 'Bill authorized'); } catch (e) { next(e); }
};

module.exports = { getSummary, listBills, getBill, createBill, updateBill, authorizeBill };
