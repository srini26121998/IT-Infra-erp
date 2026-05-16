'use strict';
const { query } = require('../../db/pool');

/* ─── Departments ───────────────────────────────────────────── */

const listDepartments = async () => {
  const { rows } = await query(`
    SELECT d.*, COUNT(e.id) AS employee_count, hd.name AS head_name, pd.name AS parent_name
    FROM departments d
    LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL
    LEFT JOIN employees hd ON hd.id = d.head_employee_id
    LEFT JOIN departments pd ON pd.id = d.parent_department_id
    WHERE d.deleted_at IS NULL
    GROUP BY d.id, hd.name, pd.name
    ORDER BY d.name;
  `);
  return rows;
};

const findDepartmentById = async (id) => {
  const { rows } = await query('SELECT * FROM departments WHERE id = $1 AND deleted_at IS NULL', [id]);
  return rows[0] || null;
};

const createDepartment = async (data) => {
  const { name, code, headEmployeeId, parentDepartmentId } = data;
  const { rows } = await query(
    `INSERT INTO departments (name, code, head_employee_id, parent_department_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, code, headEmployeeId || null, parentDepartmentId || null]
  );
  return rows[0];
};

const updateDepartment = async (id, data) => {
  const { name, code, headEmployeeId, parentDepartmentId, status } = data;
  const { rows } = await query(
    `UPDATE departments SET name = $2, code = $3, head_employee_id = $4, parent_department_id = $5, status = $6, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
    [id, name, code, headEmployeeId || null, parentDepartmentId || null, status]
  );
  return rows[0];
};

const softDeleteDepartment = async (id) => {
  // Spec check: only if no active employees
  const { rowCount } = await query(`
    UPDATE departments SET deleted_at = NOW()
    WHERE id = $1
    AND NOT EXISTS (
      SELECT 1 FROM employees
      WHERE department_id = $1 AND status = 'Active' AND deleted_at IS NULL
    );
  `, [id]);
  return rowCount > 0;
};

/* ─── Designations ─────────────────────────────────────────── */

const listDesignations = async () => {
  const { rows } = await query(`
    SELECT des.*, COUNT(e.id) AS employee_count
    FROM designations des
    LEFT JOIN employees e ON e.designation_id = des.id AND e.deleted_at IS NULL
    WHERE des.deleted_at IS NULL
    GROUP BY des.id
    ORDER BY des.name;
  `);
  return rows;
};

const findDesignationById = async (id) => {
  const { rows } = await query('SELECT * FROM designations WHERE id = $1 AND deleted_at IS NULL', [id]);
  return rows[0] || null;
};

const createDesignation = async (data) => {
  const { name, grade, departmentId } = data;
  const { rows } = await query(
    `INSERT INTO designations (name, grade, department_id)
     VALUES ($1, $2, $3) RETURNING *`,
    [name, grade || null, departmentId || null]
  );
  return rows[0];
};

const updateDesignation = async (id, data) => {
  const { name, grade, departmentId, status } = data;
  const { rows } = await query(
    `UPDATE designations SET name = $2, grade = $3, department_id = $4, status = $5, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
    [id, name, grade || null, departmentId || null, status]
  );
  return rows[0];
};

const softDeleteDesignation = async (id) => {
  const { rowCount } = await query('UPDATE designations SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL', [id]);
  return rowCount > 0;
};

module.exports = {
  listDepartments, findDepartmentById, createDepartment, updateDepartment, softDeleteDepartment,
  listDesignations, findDesignationById, createDesignation, updateDesignation, softDeleteDesignation
};
