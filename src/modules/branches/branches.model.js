'use strict';
const { query } = require('../../db/pool');

const listBranches = async ({ companyId, status, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT b.*, c.name AS company_name, COUNT(e.id) AS employee_count
    FROM branches b
    LEFT JOIN companies c ON c.id = b.company_id
    LEFT JOIN employees e ON e.branch_id = b.id AND e.deleted_at IS NULL
    WHERE b.deleted_at IS NULL
  `;
  const params = [];

  if (companyId) {
    params.push(companyId);
    sql += ` AND b.company_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    sql += ` AND b.status = $${params.length}`;
  }

  sql += ` GROUP BY b.id, c.name ORDER BY b.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const { rows } = await query(sql, [...params, limit, offset]);
  return rows;
};

const findById = async (id) => {
  const { rows } = await query('SELECT b.*, c.name AS company_name FROM branches b JOIN companies c ON c.id = b.company_id WHERE b.id = $1 AND b.deleted_at IS NULL', [id]);
  return rows[0] || null;
};

const createBranch = async (data) => {
  const { company_id, name, code, location, address, phone, email, manager, coordinates } = data;
  const { rows } = await query(`
    INSERT INTO branches (company_id, name, code, location, address, phone, email, manager, coordinates)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
  `, [company_id, name, code, location, address, phone, email, manager, coordinates]);
  return rows[0];
};

const updateBranch = async (id, data) => {
  const { name, location, address, phone, email, manager, coordinates, status } = data;
  const { rows } = await query(`
    UPDATE branches SET 
      name = $2, location = $3, address = $4, phone = $5, email = $6, 
      manager = $7, coordinates = $8, status = $9, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL RETURNING *;
  `, [id, name, location, address, phone, email, manager, coordinates, status]);
  return rows[0];
};

const softDelete = async (id) => {
  const { rowCount } = await query('UPDATE branches SET deleted_at = NOW() WHERE id = $1', [id]);
  return rowCount > 0;
};

module.exports = { listBranches, findById, createBranch, updateBranch, softDelete };
