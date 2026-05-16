'use strict';
const svc = require('./invoices.service');
const { success } = require('../../utils/response');

const listInvoices = async (req, res, next) => {
  try { return success(res, await svc.listInvoices(req.query)); } catch (e) { next(e); }
};
const getInvoice = async (req, res, next) => {
  try { return success(res, await svc.getInvoice(req.params.id)); } catch (e) { next(e); }
};
const createInvoice = async (req, res, next) => {
  try { return success(res, await svc.createInvoice(req.body), 'Invoice created', 201); } catch (e) { next(e); }
};
const recordPayment = async (req, res, next) => {
  try { return success(res, await svc.recordPayment(req.params.id, req.body), 'Payment recorded'); } catch (e) { next(e); }
};
const updateStatus = async (req, res, next) => {
  try { return success(res, await svc.updateStatus(req.params.id, req.body.status), 'Status updated'); } catch (e) { next(e); }
};

module.exports = { listInvoices, getInvoice, createInvoice, recordPayment, updateStatus };
