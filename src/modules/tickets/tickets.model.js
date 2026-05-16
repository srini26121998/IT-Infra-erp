'use strict';
const { query } = require('../../db/pool');

const listTickets = async ({ role, userId, status, page = 1, limit = 20, search }) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT t.*, e.name as assignee_name 
    FROM tickets t
    LEFT JOIN employees e ON t.assigned_employee_id = e.id
    WHERE t.deleted_at IS NULL
  `;
  const params = [];

  // Role filtering
  if (role === 'employee') {
    params.push(userId);
    sql += ` AND t.assigned_employee_id = $${params.length}`;
  }

  if (status && status !== 'all') {
    params.push(status);
    sql += ` AND t.status = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (t.subject ILIKE $${params.length} OR t.id ILIKE $${params.length})`;
  }

  sql += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const { rows } = await query(sql, [...params, limit, offset]);
  return rows;
};

const getStats = async () => {
  const { rows } = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'Pending') as pending,
      COUNT(*) FILTER (WHERE status = 'Assigned') as assigned,
      COUNT(*) FILTER (WHERE status = 'Under Review') as under_review,
      COUNT(*) FILTER (WHERE status = 'Approved') as resolved,
      COUNT(*) FILTER (WHERE sla_status = 'Overdue') as overdue,
      COUNT(*) FILTER (WHERE priority = 'Critical') as critical
    FROM tickets WHERE deleted_at IS NULL
  `);
  return rows[0];
};

const exportTickets = async (format) => {
  const { rows } = await query('SELECT * FROM tickets WHERE deleted_at IS NULL ORDER BY created_at DESC');
  // In a real app, you'd use a library like exceljs or jspdf here.
  // Returning the raw data for integration demonstration.
  return rows;
};

const findById = async (id) => {
  const { rows: ticket } = await query(`
    SELECT t.*, e.name as assignee_name 
    FROM tickets t
    LEFT JOIN employees e ON t.assigned_employee_id = e.id
    WHERE t.id = $1 AND t.deleted_at IS NULL
  `, [id]);
  if (!ticket[0]) return null;
  const { rows: timeline } = await query('SELECT * FROM ticket_timeline WHERE ticket_id = $1 ORDER BY created_at ASC', [id]);
  return { ...ticket[0], timeline };
};

const createTicket = async (data) => {
  const { subject, description, priority, requester } = data;
  const companyName = data.companyName || data.company_name;
  const mobileNumber = data.mobileNumber || data.mobile_number;
  const emailId = data.emailId || data.email_id;
  
  const { rows } = await query(`
    INSERT INTO tickets (
      id, subject, description, priority, requester, company_name, mobile_number, email_id,
      response_sla_time, resolution_sla_time
    )
    VALUES (
      'TKT-' || LPAD(nextval('ticket_seq')::TEXT, 4, '0'),
      $1, $2, $3::TEXT, $4, $5, $6, $7,
      NOW() + CASE $3::TEXT
        WHEN 'Critical' THEN INTERVAL '1 hour'
        WHEN 'High'     THEN INTERVAL '4 hours'
        WHEN 'Medium'   THEN INTERVAL '8 hours'
        ELSE                 INTERVAL '24 hours'
      END,
      NOW() + CASE $3::TEXT
        WHEN 'Critical' THEN INTERVAL '4 hours'
        WHEN 'High'     THEN INTERVAL '12 hours'
        WHEN 'Medium'   THEN INTERVAL '24 hours'
        ELSE                 INTERVAL '72 hours'
      END
    ) RETURNING *;
  `, [subject, description, priority, requester, companyName, mobileNumber, emailId]);
  
  await addTimeline(rows[0].id, 'Ticket created', requester || 'System');
  return rows[0];
};

const assignTicket = async (id, employeeId, deadline, actor) => {
  const { rows } = await query(`
    UPDATE tickets SET 
      status = 'Assigned', assigned_employee_id = $2, deadline = $3, 
      acknowledged_at = NOW(), updated_at = NOW()
    WHERE id = $1 RETURNING *;
  `, [id, employeeId, deadline]);
  
  await addTimeline(id, `Ticket assigned to technician`, actor || 'System');
  return rows[0];
};

const submitWork = async (id, text, screenshot, actor) => {
  const { rows } = await query(`
    UPDATE tickets SET 
      status = 'Under Review', submission_text = $2, submission_screenshot = $3, updated_at = NOW()
    WHERE id = $1 RETURNING *;
  `, [id, text, screenshot]);
  
  await addTimeline(id, 'Work submitted for review', actor || 'System');
  return rows[0];
};

const reviewTicket = async (id, status, feedback, actor) => {
  const { rows } = await query(`
    UPDATE tickets SET 
      status = $2, manager_feedback = $3, sla_status = 'Resolved', updated_at = NOW()
    WHERE id = $1 RETURNING *;
  `, [id, status, feedback]);
  
  await addTimeline(id, `Ticket review: ${status}`, actor || 'System');
  return rows[0];
};

const acknowledgeTicket = async (id, actor) => {
  const { rows } = await query(`
    UPDATE tickets SET acknowledged_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *;
  `, [id]);
  await addTimeline(id, 'Ticket acknowledged', actor || 'System');
  return rows[0];
};

const acknowledgeAll = async (actor) => {
  await query("UPDATE tickets SET acknowledged_at = NOW(), updated_at = NOW() WHERE acknowledged_at IS NULL AND deleted_at IS NULL");
  // Ideally log this too, but for simplicity:
  return true;
};

const addTimeline = async (ticketId, event, actor) => {
  await query('INSERT INTO ticket_timeline (ticket_id, event, actor) VALUES ($1, $2, $3)', [ticketId, event, actor]);
};

module.exports = { listTickets, findById, createTicket, assignTicket, submitWork, reviewTicket, acknowledgeTicket, acknowledgeAll, addTimeline, getStats, exportTickets };
