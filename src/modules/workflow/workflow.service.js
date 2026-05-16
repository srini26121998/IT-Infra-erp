'use strict';
const model = require('./workflow.model');

const listRequests = (params) => model.listRequests(params);
const createRequest = (data, requesterId) => model.createRequest(data, requesterId);
const getDashboard = () => model.getDashboardKPIs();
const updateStatus = (id, status, feedback, actor) => model.updateStatus(id, status, feedback, actor);

module.exports = { listRequests, createRequest, getDashboard, updateStatus };
