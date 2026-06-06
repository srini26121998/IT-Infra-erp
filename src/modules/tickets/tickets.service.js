'use strict';
const model = require('./tickets.model');

const listTickets = (params) => model.listTickets(params);
const getStats = () => model.getStats();
const exportTickets = (format) => model.exportTickets(format);
const getTicket = (id) => model.findById(id);
const createTicket = (data) => model.createTicket(data);
const assignTicket = async (id, employeeId, deadline, actor, assigneeType) => {
  const ticket = await model.assignTicket(id, employeeId, deadline, actor, assigneeType);
  const notifModel = require('../notifications/notifications.model');
  const { query } = require('../../db/pool');
  
  const { rows } = await query('SELECT id FROM users WHERE employee_id = $1 OR company_id = $1 LIMIT 1', [employeeId]);
  if (rows.length > 0) {
    await notifModel.createNotification(rows[0].id, 'project', 'Ticket Assigned', `You have been assigned ticket ${id}`);
  }
  
  await notifModel.notifyRoles(['admin'], 'project', 'Ticket Assigned', `Ticket ${id} has been assigned to a ${assigneeType === 'contract' || assigneeType === 'company' ? 'contractor' : 'technician'} by ${actor}`);
  
  return ticket;
};

const submitWork = async (id, text, screenshot, actor, hardwareDetails) => {
  const ticket = await model.submitWork(id, text, screenshot, actor, hardwareDetails);
  const notifModel = require('../notifications/notifications.model');
  await notifModel.notifyRoles(['admin', 'manager'], 'project', 'Ticket Resolved', `Ticket ${id} has been marked as resolved by ${actor}`);
  return ticket;
};

const reviewTicket = async (id, status, feedback, actor) => {
  const ticket = await model.reviewTicket(id, status, feedback, actor);
  if (status === 'Approved') {
    const notifModel = require('../notifications/notifications.model');
    await notifModel.notifyRoles(['admin'], 'project', 'Ticket Approved', `Ticket ${id} has been approved by ${actor}`);
  }
  return ticket;
};

const acknowledgeTicket = (id, actor) => model.acknowledgeTicket(id, actor);
const acknowledgeAll = (actor) => model.acknowledgeAll(actor);

module.exports = { listTickets, getStats, exportTickets, getTicket, createTicket, assignTicket, submitWork, reviewTicket, acknowledgeTicket, acknowledgeAll };
