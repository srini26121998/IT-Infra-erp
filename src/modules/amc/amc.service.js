'use strict';
const model = require('./amc.model');

const listContracts = (filters) => model.listContracts(filters);
const getContract = (id) => model.findById(id);
const createContract = (data) => model.createContract(data);
const getPenaltyReport = () => model.getPenaltyReport();

const listTickets = (amcId) => model.listTickets(amcId);
const createTicket = (data) => model.createTicket(data);
const updateTicketStatus = (id, status, actualTime) => model.updateTicketStatus(id, status, actualTime);

module.exports = { listContracts, getContract, createContract, getPenaltyReport, listTickets, createTicket, updateTicketStatus };
