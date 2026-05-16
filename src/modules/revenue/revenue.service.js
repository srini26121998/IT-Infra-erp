'use strict';
const model = require('./revenue.model');

const getDashboardSummary = async () => {
  const summary = await model.getSummary();
  const trend = await model.getTrend();
  return { ...summary, trend };
};

const listRaBills = (params) => model.listRaBills(params);
const getBillDetail = (id) => model.findById(id);
const createBill = (data) => model.createRaBill(data);
const updateBill = (id, data) => model.updateRaBill(id, data);
const authorizeBill = (id) => model.authorizeBill(id);

module.exports = { 
  getDashboardSummary, 
  listRaBills, 
  getBillDetail, 
  createBill, 
  updateBill, 
  authorizeBill 
};
