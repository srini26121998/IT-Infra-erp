'use strict';
const model = require('./invoices.model');

const listInvoices = (params) => model.listInvoices(params);
const getInvoice = (id) => model.findById(id);
const createInvoice = (data) => model.createInvoice(data);
const recordPayment = (id, data) => model.recordPayment(id, data);
const updateStatus = (id, status) => model.updateStatus(id, status);

module.exports = { listInvoices, getInvoice, createInvoice, recordPayment, updateStatus };
