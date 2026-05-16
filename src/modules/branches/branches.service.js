'use strict';
const model = require('./branches.model');

const listBranches = (params) => model.listBranches(params);
const getBranch = (id) => model.findById(id);
const createBranch = (data) => model.createBranch(data);
const updateBranch = (id, data) => model.updateBranch(id, data);
const deleteBranch = (id) => model.softDelete(id);

module.exports = { listBranches, getBranch, createBranch, updateBranch, deleteBranch };
