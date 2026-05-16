'use strict';
const { query } = require('../../db/pool');

const listRoles = async () => {
  const { rows } = await query(`
    SELECT r.*, COUNT(u.id) AS users_count
    FROM roles r
    LEFT JOIN users u ON u.role::TEXT = LOWER(REPLACE(r.name, ' ', '-')) AND u.deleted_at IS NULL
    GROUP BY r.id ORDER BY r.name;
  `);
  return rows;
};

const findById = async (id) => {
  const { rows } = await query('SELECT * FROM roles WHERE id = $1', [id]);
  return rows[0] || null;
};

const createRole = async (data) => {
  const { name, description, permissions } = data;
  const { rows } = await query(`
    INSERT INTO roles (name, description, permissions)
    VALUES ($1, $2, $3) RETURNING *;
  `, [name, description, permissions || []]);
  return rows[0];
};

const updatePermissions = async (id, permissions) => {
  const { rows } = await query('UPDATE roles SET permissions = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, permissions]);
  return rows[0];
};

const checkPermission = async (userId, permission) => {
  const { rows } = await query(`
    SELECT EXISTS (
      SELECT 1 FROM roles r
      JOIN users u ON LOWER(REPLACE(r.name, ' ', '-')) = u.role::TEXT
      WHERE u.id = $1 AND ($2 = ANY(r.permissions) OR 'all' = ANY(r.permissions))
    ) AS has_permission;
  `, [userId, permission]);
  return rows[0].has_permission;
};

const updateRole = async (id, data) => {
  const { name, description } = data;
  const { rows } = await query(`
    UPDATE roles SET name = $2, description = $3, updated_at = NOW() WHERE id = $1 RETURNING *;
  `, [id, name, description]);
  return rows[0];
};

const deleteRole = async (id) => {
  await query('DELETE FROM roles WHERE id = $1', [id]);
  return true;
};

module.exports = { listRoles, findById, createRole, updateRole, deleteRole, updatePermissions, checkPermission };
