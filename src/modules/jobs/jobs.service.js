'use strict';
const model = require('./jobs.model');

const listJobs = ({ status, page = 1, limit = 20 }) => model.listJobs({ status, page: +page, limit: +limit });
const getJob = (id) => model.findById(id);
const createJob = (data, createdBy) => model.createJob(data, createdBy);
const updateJob = (id, data) => model.updateJob(id, data);
const patchStatus = (id, status) => model.patchStatus(id, status);
const deleteJob = (id) => model.softDelete(id);

module.exports = { listJobs, getJob, createJob, updateJob, patchStatus, deleteJob };
