'use strict';
const svc = require('./amc.service');
const { success } = require('../../utils/response');

// Contracts
const listContracts = async (req, res, next) => {
  try { return success(res, await svc.listContracts(req.query)); } catch (e) { next(e); }
};
const getContract = async (req, res, next) => {
  try { return success(res, await svc.getContract(req.params.id)); } catch (e) { next(e); }
};
const createContract = async (req, res, next) => {
  try { return success(res, await svc.createContract(req.body), 'AMC contract created', 201); } catch (e) { next(e); }
};
const updateContract = async (req, res, next) => {
  try { return success(res, await svc.updateContract(req.params.id, req.body), 'AMC contract updated'); } catch (e) { next(e); }
};
const getPenaltyReport = async (req, res, next) => {
  try { return success(res, await svc.getPenaltyReport()); } catch (e) { next(e); }
};

// Tickets
const listTickets = async (req, res, next) => {
  try { return success(res, await svc.listTickets(req.query.amcId)); } catch (e) { next(e); }
};
const getTicket = async (req, res, next) => {
  try { return success(res, await svc.getTicket(req.params.id)); } catch (e) { next(e); }
};
const createTicket = async (req, res, next) => {
  try { return success(res, await svc.createTicket(req.body), 'Service ticket created', 201); } catch (e) { next(e); }
};
const updateTicketStatus = async (req, res, next) => {
  try {
    const { status, actual_time } = req.body;
    return success(res, await svc.updateTicketStatus(req.params.id, status, actual_time), 'Ticket status updated');
  } catch (e) { next(e); }
};

module.exports = { listContracts, getContract, createContract, updateContract, getPenaltyReport, listTickets, getTicket, createTicket, updateTicketStatus };
