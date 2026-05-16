'use strict';
const { query } = require('../../db/pool');

const listCompanies = async ({ status, name, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT c.*, COUNT(b.id) AS branch_count
    FROM companies c
    LEFT JOIN branches b ON b.company_id = c.id AND b.deleted_at IS NULL
    WHERE c.deleted_at IS NULL
  `;
  const params = [];

  if (status) {
    params.push(status);
    sql += ` AND c.status = $${params.length}`;
  }
  if (name) {
    params.push(`%${name}%`);
    sql += ` AND c.name ILIKE $${params.length}`;
  }

  sql += ` GROUP BY c.id ORDER BY c.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const { rows } = await query(sql, [...params, limit, offset]);
  return rows;
};

const findById = async (id) => {
  const { rows } = await query('SELECT * FROM companies WHERE id = $1 AND deleted_at IS NULL', [id]);
  return rows[0] || null;
};

const createCompany = async (data) => {
  const { name, industry, head, email, phone, location, address, coordinates, subscription_plan, billing_cycle, activation_date, renewal_date, monthly_cost, annual_cost } = data;
  
  const { rows } = await query(`
    INSERT INTO companies (
      code, name, industry, head, email, phone, location, address, coordinates, 
      subscription_plan, billing_cycle, activation_date, renewal_date, monthly_cost, annual_cost
    )
    VALUES (
      'COMP-' || LPAD((SELECT COUNT(*)+1 FROM companies)::TEXT, 4, '0'),
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    ) RETURNING *;
  `, [name, industry, head, email, phone, location, address, coordinates, subscription_plan, billing_cycle, activation_date, renewal_date, monthly_cost, annual_cost]);
  
  return rows[0];
};

const updateCompany = async (id, data) => {
  const { name, industry, head, email, phone, location, address, coordinates, status } = data;
  const { rows } = await query(`
    UPDATE companies SET 
      name = $2, industry = $3, head = $4, email = $5, phone = $6, 
      location = $7, address = $8, coordinates = $9, status = $10, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL RETURNING *;
  `, [id, name, industry, head, email, phone, location, address, coordinates, status]);
  return rows[0];
};

const patchStatus = async (id, status) => {
  const { rows } = await query('UPDATE companies SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, status]);
  return rows[0];
};

const softDelete = async (id) => {
  const { rowCount } = await query('UPDATE companies SET deleted_at = NOW() WHERE id = $1', [id]);
  return rowCount > 0;
};

module.exports = { listCompanies, findById, createCompany, updateCompany, patchStatus, softDelete };
