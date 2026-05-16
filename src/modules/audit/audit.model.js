'use strict';
const { query } = require('../../db/pool');

const listLogs = async ({ userId, action, resourceType, startDate, endDate, page = 1, limit = 50 }) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT al.*, u.email AS user_email
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    WHERE 1=1
  `;
  const params = [];

  if (userId) { params.push(userId); sql += ` AND al.user_id = $${params.length}`; }
  if (action) { params.push(action); sql += ` AND al.action = $${params.length}`; }
  if (resourceType) { params.push(resourceType); sql += ` AND al.resource_type = $${params.length}`; }
  if (startDate) { params.push(startDate); sql += ` AND al.created_at::DATE >= $${params.length}`; }
  if (endDate) { params.push(endDate); sql += ` AND al.created_at::DATE <= $${params.length}`; }

  sql += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const { rows } = await query(sql, [...params, limit, offset]);
  return rows;
};

const findById = async (id) => {
  const { rows } = await query('SELECT * FROM audit_logs WHERE id = $1', [id]);
  return rows[0] || null;
};

module.exports = { listLogs, findById };
