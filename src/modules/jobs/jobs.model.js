'use strict';
const { query } = require('../../db/pool');

const listJobs = async ({ status, page, limit }) => {
  const offset = (page - 1) * limit;
  const { rows } = await query(`
    SELECT j.*, d.name AS dept_name, des.name AS desig_name
    FROM job_openings j
    LEFT JOIN departments d ON d.id = j.department_id
    LEFT JOIN designations des ON des.id = j.designation_id
    WHERE j.deleted_at IS NULL
    AND ($1::TEXT IS NULL OR j.status = $1)
    ORDER BY j.created_at DESC
    LIMIT $2 OFFSET $3;
  `, [status || null, limit, offset]);

  const countRes = await query('SELECT COUNT(*) FROM job_openings WHERE deleted_at IS NULL AND ($1::TEXT IS NULL OR status = $1)', [status || null]);
  
  return { rows, total: Number(countRes.rows[0].count) };
};

const findById = async (id) => {
  const { rows } = await query(`
    SELECT j.*, d.name AS dept_name, des.name AS desig_name
    FROM job_openings j
    LEFT JOIN departments d ON d.id = j.department_id
    LEFT JOIN designations des ON des.id = j.designation_id
    WHERE j.id = $1 AND j.deleted_at IS NULL
  `, [id]);
  return rows[0] || null;
};

const createJob = async (data, createdBy) => {
  const { title, departmentId, designationId, openings, jobType, location, description, requirements, salaryRange, deadline, status } = data;
  const { rows } = await query(`
    INSERT INTO job_openings (title, department_id, designation_id, openings, job_type, location, description, requirements, salary_range, deadline, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;
  `, [title, departmentId, designationId, openings || 1, jobType, location, description, requirements, salaryRange, deadline, status || 'Open', createdBy]);
  return rows[0];
};

const updateJob = async (id, data) => {
  const { title, departmentId, designationId, openings, jobType, location, description, requirements, salaryRange, deadline, status } = data;
  const { rows } = await query(`
    UPDATE job_openings SET title = $2, department_id = $3, designation_id = $4, openings = $5, job_type = $6, location = $7, description = $8, requirements = $9, salary_range = $10, deadline = $11, status = $12, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL RETURNING *;
  `, [id, title, departmentId, designationId, openings, jobType, location, description, requirements, salaryRange, deadline, status]);
  return rows[0];
};

const patchStatus = async (id, status) => {
  const { rows } = await query('UPDATE job_openings SET status = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *', [id, status]);
  return rows[0];
};

const softDelete = async (id) => {
  await query('UPDATE job_openings SET deleted_at = NOW() WHERE id = $1', [id]);
};

module.exports = { listJobs, findById, createJob, updateJob, patchStatus, softDelete };
