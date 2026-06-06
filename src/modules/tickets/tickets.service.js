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
  
  // Notify the assigned employee
  if (assigneeType !== 'contract') {
    await notifModel.createNotification(employeeId, 'project', 'Ticket Assigned', `You have been assigned ticket ${id}`);
  }
  
  // Notify admin about the assignment
  await notifModel.notifyRoles(['admin'], 'project', 'Ticket Assigned', `Ticket ${id} has been assigned to a ${assigneeType === 'contract' ? 'contractor' : 'technician'} by ${actor}`);
  
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
