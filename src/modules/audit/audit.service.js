'use strict';
const model = require('./audit.model');

const listLogs = (params) => model.listLogs(params);
const getLogDetail = (id) => model.findById(id);

module.exports = { listLogs, getLogDetail };
