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
  if (assigneeType !== 'company') {
    await notifModel.createNotification(employeeId, 'project', 'Ticket Assigned', `You have been assigned ticket ${id}`);
  }
  
  // Notify admin, manager, hr about the assignment
  await notifModel.notifyRoles(['admin', 'manager', 'hr'], 'project', 'Ticket Assigned', `Ticket ${id} has been assigned to a ${assigneeType === 'company' ? 'company' : 'technician'} by ${actor}`);
  
  return ticket;
};
const submitWork = (id, text, screenshot, actor, hardwareDetails) => model.submitWork(id, text, screenshot, actor, hardwareDetails);
const reviewTicket = (id, status, feedback, actor) => model.reviewTicket(id, status, feedback, actor);
const acknowledgeTicket = (id, actor) => model.acknowledgeTicket(id, actor);
const acknowledgeAll = (actor) => model.acknowledgeAll(actor);

module.exports = { listTickets, getStats, exportTickets, getTicket, createTicket, assignTicket, submitWork, reviewTicket, acknowledgeTicket, acknowledgeAll };
