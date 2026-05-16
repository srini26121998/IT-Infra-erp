'use strict';
const model = require('./tickets.model');

const listTickets = (params) => model.listTickets(params);
const getStats = () => model.getStats();
const exportTickets = (format) => model.exportTickets(format);
const getTicket = (id) => model.findById(id);
const createTicket = (data) => model.createTicket(data);
const assignTicket = (id, employeeId, deadline, actor) => model.assignTicket(id, employeeId, deadline, actor);
const submitWork = (id, text, screenshot, actor) => model.submitWork(id, text, screenshot, actor);
const reviewTicket = (id, status, feedback, actor) => model.reviewTicket(id, status, feedback, actor);
const acknowledgeTicket = (id, actor) => model.acknowledgeTicket(id, actor);
const acknowledgeAll = (actor) => model.acknowledgeAll(actor);

module.exports = { listTickets, getStats, exportTickets, getTicket, createTicket, assignTicket, submitWork, reviewTicket, acknowledgeTicket, acknowledgeAll };
