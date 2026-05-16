'use strict';
const { query } = require('../../db/pool');

const listProjects = async ({ status, page, limit }) => {
  const offset = (page - 1) * limit;
  const { rows } = await query(`
    SELECT p.*, e.name AS manager_name, COUNT(pt.id) AS team_size
    FROM projects p
    LEFT JOIN employees e ON e.id = p.manager_id
    LEFT JOIN project_team pt ON pt.project_id = p.id
    WHERE p.deleted_at IS NULL
    AND ($1::TEXT IS NULL OR p.status = $1)
    GROUP BY p.id, e.name
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3;
  `, [status || null, limit, offset]);

  const countRes = await query('SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL AND ($1::TEXT IS NULL OR status = $1)', [status || null]);
  
  return { rows, total: Number(countRes.rows[0].count) };
};

const findById = async (id) => {
  const { rows } = await query(`
    SELECT p.*, e.name AS manager_name
    FROM projects p
    LEFT JOIN employees e ON e.id = p.manager_id
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `, [id]);
  return rows[0] || null;
};

const createProject = async (data) => {
  const { 
    name, code, client, 
    managerId, manager_id, 
    startDate, start_date, 
    endDate, end_date, 
    status, budget, description 
  } = data;

  const mId = managerId || manager_id;
  const sDate = startDate || start_date;
  const eDate = endDate || end_date;

  const { rows } = await query(`
    INSERT INTO projects (name, code, client, manager_id, start_date, end_date, status, budget, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
  `, [name, code, client, mId || null, sDate, eDate || null, status || 'Planning', budget || 0, description]);
  return rows[0];
};

const updateProject = async (id, data) => {
  const { 
    name, code, client, 
    managerId, manager_id, 
    startDate, start_date, 
    endDate, end_date, 
    status, budget, 
    completionPercent, completion_percent, 
    description 
  } = data;

  const mId = managerId || manager_id;
  const sDate = startDate || start_date;
  const eDate = endDate || end_date;
  const cPercent = completionPercent || completion_percent;

  const { rows } = await query(`
    UPDATE projects SET name = $2, code = $3, client = $4, manager_id = $5, start_date = $6, end_date = $7, status = $8, budget = $9, completion_percent = $10, description = $11, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL RETURNING *;
  `, [id, name, code, client, mId || null, sDate || null, eDate || null, status, budget || 0, cPercent || 0, description]);
  return rows[0];
};

const softDelete = async (id) => {
  await query('UPDATE projects SET deleted_at = NOW() WHERE id = $1', [id]);
};

const addTeamMember = async (projectId, employeeId, role) => {
  const { rows } = await query(`
    INSERT INTO project_team (project_id, employee_id, role)
    VALUES ($1, $2, $3)
    ON CONFLICT (project_id, employee_id) DO UPDATE SET role = EXCLUDED.role
    RETURNING *;
  `, [projectId, employeeId, role]);
  return rows[0];
};

const listTeam = async (projectId) => {
  const { rows } = await query(`
    SELECT pt.*, e.name AS employee_name, e.employee_id AS emp_code
    FROM project_team pt
    JOIN employees e ON e.id = pt.employee_id
    WHERE pt.project_id = $1
  `, [projectId]);
  return rows;
};

module.exports = { listProjects, findById, createProject, updateProject, softDelete, addTeamMember, listTeam };
