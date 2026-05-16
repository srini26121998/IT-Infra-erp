'use strict';
const { query } = require('../../db/pool');

const listRequests = async ({ role, userId, status, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT wr.*, u.name AS requester_name, e.name AS assigned_employee
    FROM workflow_requests wr
    JOIN users u ON u.id = wr.requester_id
    LEFT JOIN employees e ON e.id = wr.assigned_to
    WHERE 1=1
  `;
  const params = [];

  if (role === 'employee') {
    params.push(userId);
    sql += ` AND wr.assigned_to = (SELECT id FROM employees WHERE user_id = $${params.length})`;
  }
  if (status) {
    params.push(status);
    sql += ` AND wr.status = $${params.length}`;
  }

  sql += ` ORDER BY wr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const { rows } = await query(sql, [...params, limit, offset]);
  return rows;
};

const createRequest = async (data, requesterId) => {
  const { subject, description, priority, company_id } = data;
  
  const { rows: sla } = await query('SELECT * FROM sla_config WHERE priority = $1', [priority]);
  const config = sla[0] || { response_hours: 8, resolution_hours: 24 };

  const { rows } = await query(`
    INSERT INTO workflow_requests (
      subject, description, priority, requester_id, company_id, 
      response_sla, resolution_sla, timeline
    )
    VALUES ($1, $2, $3, $4, $5, NOW() + $6 * INTERVAL '1 hour', NOW() + $7 * INTERVAL '1 hour', $8)
    RETURNING *;
  `, [subject, description, priority, requesterId, company_id, config.response_hours, config.resolution_hours, JSON.stringify([{ event: 'Created', time: new Date() }])]);
  
  return rows[0];
};

const getDashboardKPIs = async () => {
  const { rows } = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'Pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'Assigned') AS assigned,
      COUNT(*) FILTER (WHERE status = 'Under Review') AS under_review,
      COUNT(*) FILTER (WHERE status = 'Approved') AS approved,
      COUNT(*) FILTER (WHERE status = 'Rejected') AS rejected,
      COUNT(*) FILTER (WHERE sla_breached) AS sla_breached
    FROM workflow_requests;
  `);
  return rows[0];
};

const updateStatus = async (id, status, feedback, actor) => {
  const { rows } = await query(`
    UPDATE workflow_requests SET 
      status = $2, reviewer_feedback = $3, 
      timeline = timeline || $4::JSONB,
      updated_at = NOW()
    WHERE id = $1 RETURNING *;
  `, [id, status, feedback, JSON.stringify({ event: `Status updated to ${status}`, actor, time: new Date() })]);
  return rows[0];
};

module.exports = { listRequests, createRequest, getDashboardKPIs, updateStatus };
