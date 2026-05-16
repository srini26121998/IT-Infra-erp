'use strict';
const model = require('./contracts.model');

const STATUS_SEQUENCE = ['Pre-Award', 'Award', 'Mobilization', 'Execution', 'Closure', 'Verified', 'Audited'];

const listContracts = (filters) => model.listContracts(filters);
const getContract = (id) => model.findById(id);
const createContract = (data) => model.createContract(data);
const updateContract = (id, data) => model.updateContract(id, data);

const advanceStatus = async (id, newStatus) => {
  const contract = await model.findById(id);
  if (!contract) throw Object.assign(new Error('Contract not found'), { status: 404 });

  const currentIndex = STATUS_SEQUENCE.indexOf(contract.status);
  const nextIndex = STATUS_SEQUENCE.indexOf(newStatus);

  if (nextIndex !== currentIndex + 1) {
    throw Object.assign(new Error(`Invalid status transition from ${contract.status} to ${newStatus}`), { status: 400 });
  }

  return model.advanceStatus(id, newStatus, contract.status);
};

const deleteContract = (id) => model.softDelete(id);

module.exports = { listContracts, getContract, createContract, updateContract, advanceStatus, deleteContract };
