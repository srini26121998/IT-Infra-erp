'use strict';
const svc = require('./tickets.service');
const { success } = require('../../utils/response');

const listTickets = async (req, res, next) => {
  try {
    const { status, page, limit, search } = req.query;
    return success(res, await svc.listTickets({ role: req.user.role, userId: req.user.id, status, page, limit, search }));
  } catch (e) { next(e); }
};

const getStats = async (req, res, next) => {
  try { return success(res, await svc.getStats()); } catch (e) { next(e); }
};

const exportTickets = async (req, res, next) => {
  try {
    const { format } = req.query;
    const data = await svc.exportTickets(format);
    return success(res, data, `Tickets exported as ${format}`);
  } catch (e) { next(e); }
};

const getTicket = async (req, res, next) => {
  try {
    const ticket = await svc.getTicket(req.params.id);
    if (!ticket) throw Object.assign(new Error('Ticket not found'), { status: 404 });
    return success(res, ticket);
  } catch (e) { next(e); }
};

const createTicket = async (req, res, next) => {
  try { return success(res, await svc.createTicket(req.body), 'Ticket created', 201); } catch (e) { next(e); }
};

const assignTicket = async (req, res, next) => {
  try {
    const { employeeId, deadline, assigneeType } = req.body;
    const actor = req.user.name || req.user.email || 'System';
    return success(res, await svc.assignTicket(req.params.id, employeeId, deadline, actor, assigneeType), 'Ticket assigned');
  } catch (e) { next(e); }
};

const submitWork = async (req, res, next) => {
  try {
    const { text, screenshot, hardwareModel, hardwareCharges, timeElapsed } = req.body;
    const actor = req.user.name || req.user.email || 'System';
    return success(res, await svc.submitWork(req.params.id, text, screenshot, actor, { hardwareModel, hardwareCharges, timeElapsed }), 'Work submitted');
  } catch (e) { next(e); }
};

const reviewTicket = async (req, res, next) => {
  try {
    const { status, feedback } = req.body;
    const actor = req.user.name || req.user.email || 'System';
    return success(res, await svc.reviewTicket(req.params.id, status, feedback, actor), `Ticket ${status}`);
  } catch (e) { next(e); }
};

const acknowledgeTicket = async (req, res, next) => {
  try { 
    const actor = req.user.name || req.user.email || 'System';
    return success(res, await svc.acknowledgeTicket(req.params.id, actor), 'Ticket acknowledged'); 
  } catch (e) { next(e); }
};

const acknowledgeAll = async (req, res, next) => {
  try { 
    const actor = req.user.name || req.user.email || 'System';
    return success(res, await svc.acknowledgeAll(actor), 'All breaches acknowledged'); 
  } catch (e) { next(e); }
};

module.exports = { listTickets, getStats, exportTickets, getTicket, createTicket, assignTicket, submitWork, reviewTicket, acknowledgeTicket, acknowledgeAll };
