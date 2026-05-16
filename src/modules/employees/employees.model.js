'use strict';
const { query } = require('../../db/pool');

/* ─── List employees (paginated + filtered) ──────────────────── */
const listEmployees = async ({ status, departmentId, search, page, limit }) => {
  const offset = (page - 1) * limit;
  const dataRes = await query(
    `SELECT e.*,
            d.name  AS department_name,
            des.name AS designation_name
       FROM employees e
       LEFT JOIN departments  d   ON d.id   = e.department_id
       LEFT JOIN designations des ON des.id = e.designation_id
      WHERE e.deleted_at IS NULL
        AND ($1::text IS NULL OR $1 = '' OR e.status = $1)
        AND ($2::uuid IS NULL OR e.department_id = $2)
        AND ($3::text IS NULL OR e.name ILIKE '%' || $3 || '%')
      ORDER BY e.name
      LIMIT $4 OFFSET $5`,
    [status || null, departmentId || null, search || null, limit, offset]
  );

  const countRes = await query(
    `SELECT COUNT(*) FROM employees e
      WHERE e.deleted_at IS NULL
        AND ($1::text IS NULL OR $1 = '' OR e.status = $1)
        AND ($2::uuid IS NULL OR e.department_id = $2)
        AND ($3::text IS NULL OR e.name ILIKE '%' || $3 || '%')`,
    [status || null, departmentId || null, search || null]
  );

  return { rows: dataRes.rows, total: Number(countRes.rows[0].count) };
};

/* ─── Find by ID ─────────────────────────────────────────────── */
const findById = async (id) => {
  const { rows } = await query(
    `SELECT e.*,
            d.name  AS department_name,
            des.name AS designation_name,
            b.name  AS branch_name
       FROM employees e
       LEFT JOIN departments  d   ON d.id   = e.department_id
       LEFT JOIN designations des ON des.id = e.designation_id
       LEFT JOIN branches     b   ON b.id   = e.branch_id
      WHERE e.id = $1 AND e.deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
};

/* ─── Auto-generate employee_id ──────────────────────────────── */
const nextEmployeeId = async () => {
  const { rows } = await query(
    `SELECT 'EMP-' || LPAD((COUNT(*) + 1)::TEXT, 4, '0') AS next_id
       FROM employees WHERE deleted_at IS NULL`
  );
  return rows[0].next_id;
};

/* ─── Helper: Resolve Name to ID (upsert) ───────────────────── */
const resolveId = async (table, name) => {
  if (!name || name === 'N/A') return null;
  // If it's already a UUID, return as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(name)) return name;

  // Try to find existing record
  const { rows: found } = await query(
    `SELECT id FROM ${table} WHERE name ILIKE $1 AND deleted_at IS NULL LIMIT 1`, [name]
  );
  if (found[0]) return found[0].id;

  // Auto-create only for tables that don't have complex mandatory fields.
  // 'branches' requires company_id, location, etc., so we cannot auto-create it with just a name.
  if (['departments', 'designations'].includes(table)) {
    const { rows: created } = await query(
      `INSERT INTO ${table} (name) VALUES ($1) RETURNING id`, [name]
    );
    return created[0]?.id || null;
  }

  return null;
};

/* ─── Create ─────────────────────────────────────────────────── */
const createEmployee = async (data) => {
  const {
    employeeId, name, email, personalEmail, phoneNumber, role,
    department, departmentId, designation, designationId, branch, branchId, 
    joinDate, relievingDate, grossSalary, netSalary,
    companyId, status = 'Active',
    aadhaarNumber, panNumber, bankName, accountNumber, ifscCode
  } = data;

  // Resolve names to IDs if necessary, prioritizing explicit IDs
  const dId   = await resolveId('departments',  departmentId  || department);
  const desId = await resolveId('designations', designationId || designation);
  const bId   = await resolveId('branches',     branchId      || branch);

  const { rows } = await query(
    `INSERT INTO employees
       (employee_id, name, email, personal_email, phone_number, role,
        department_id, designation_id, join_date, relieving_date, gross_salary, net_salary,
        company_id, branch_id, status, aadhaar_number, pan_number, bank_name,
        account_number, ifsc_code)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     RETURNING *`,
    [employeeId, name, email, personalEmail || null, phoneNumber, role,
     dId, desId, joinDate, relievingDate || null,
     grossSalary || 0, netSalary || 0, companyId || null, bId, status,
     aadhaarNumber || null, panNumber || null, bankName || null,
     accountNumber || null, ifscCode || null]
  );
  return rows[0];
};

/* ─── Full update ────────────────────────────────────────────── */
const updateEmployee = async (id, data) => {
  const fields = [];
  const params = [id];

  const mapping = {
    name: 'name', email: 'email', personalEmail: 'personal_email',
    phoneNumber: 'phone_number', role: 'role', 
    department: 'department_id', departmentId: 'department_id',
    designation: 'designation_id', designationId: 'designation_id',
    branch: 'branch_id', branchId: 'branch_id',
    joinDate: 'join_date', relievingDate: 'relieving_date',
    grossSalary: 'gross_salary', netSalary: 'net_salary', 
    bankName: 'bank_name', ifscCode: 'ifsc_code', status: 'status',
    aadhaarNumber: 'aadhaar_number', panNumber: 'pan_number', accountNumber: 'account_number'
  };

  const tableMap = {
    department_id: 'departments',
    designation_id: 'designations',
    branch_id: 'branches'
  };

  const processedFields = new Set();

  for (const [key, value] of Object.entries(data)) {
    const col = mapping[key];
    if (col && !processedFields.has(col)) {
      let val = value;
      
      // Resolve name to ID for relational fields
      if (tableMap[col]) {
        val = await resolveId(tableMap[col], val);
      }

      params.push(val);
      fields.push(`${col} = $${params.length}`);
      processedFields.add(col);
    }
  }

  if (fields.length === 0) return findById(id);

  const { rows } = await query(
    `UPDATE employees SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING *`,
    params
  );
  return rows[0] || null;
};

/* ─── Status toggle ──────────────────────────────────────────── */
const patchStatus = async (id, status) => {
  const { rows } = await query(
    `UPDATE employees SET status = $2, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL RETURNING id, status`,
    [id, status]
  );
  return rows[0] || null;
};

/* ─── Soft delete ────────────────────────────────────────────── */
const softDelete = async (id) => {
  await query(
    `UPDATE employees SET deleted_at = NOW(), status = 'Inactive'
      WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
};

/* ─── Documents ──────────────────────────────────────────────── */
const addDocument = async ({ employeeId, docType, fileName, fileUrl, fileSize }) => {
  const { rows } = await query(
    `INSERT INTO employee_documents (employee_id, doc_type, file_name, file_url, file_size)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [employeeId, docType, fileName, fileUrl, fileSize || null]
  );
  return rows[0];
};

const listDocuments = async (employeeId) => {
  const { rows } = await query(
    'SELECT * FROM employee_documents WHERE employee_id = $1 ORDER BY uploaded_at DESC',
    [employeeId]
  );
  return rows;
};

/* ─── Bulk soft delete ───────────────────────────────────────── */
const bulkSoftDelete = async (ids) => {
  if (!ids || ids.length === 0) return 0;
  const { rowCount } = await query(
    `UPDATE employees SET deleted_at = NOW(), status = 'Inactive'
      WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
    [ids]
  );
  return rowCount;
};

/* ─── Performance Reviews ────────────────────────────────────── */
const addPerformanceReview = async (data) => {
  const { employeeId, reviewerName, reviewPeriod, rating, feedback, status, reviewDate } = data;
  const { rows } = await query(
    `INSERT INTO performance_reviews (employee_id, reviewer_name, review_period, rating, feedback, status, review_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [employeeId, reviewerName, reviewPeriod, rating, feedback || null, status || 'Draft', reviewDate || new Date()]
  );
  return rows[0];
};

const listPerformanceReviews = async (employeeId) => {
  const { rows } = await query(
    `SELECT p.*, e.name as employee_name, e.employee_id as emp_code
     FROM performance_reviews p
     JOIN employees e ON p.employee_id = e.id
     WHERE p.employee_id = $1 AND p.deleted_at IS NULL AND e.deleted_at IS NULL
     ORDER BY p.review_date DESC`,
    [employeeId]
  );
  return rows;
};

const listAllPerformanceReviews = async () => {
  const { rows } = await query(
    `SELECT p.*, e.name as employee_name, e.employee_id as emp_code
     FROM performance_reviews p
     JOIN employees e ON p.employee_id = e.id
     WHERE p.deleted_at IS NULL AND e.deleted_at IS NULL
     ORDER BY p.review_date DESC`
  );
  return rows;
};

const updatePerformanceReview = async (id, data) => {
  const { reviewerName, reviewPeriod, rating, feedback, status, reviewDate } = data;
  const { rows } = await query(
    `UPDATE performance_reviews SET
       reviewer_name = COALESCE($2, reviewer_name),
       review_period = COALESCE($3, review_period),
       rating = COALESCE($4, rating),
       feedback = COALESCE($5, feedback),
       status = COALESCE($6, status),
       review_date = COALESCE($7, review_date),
       updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
    [id, reviewerName, reviewPeriod, rating, feedback, status, reviewDate]
  );
  return rows[0];
};

const findPerformanceReviewById = async (id) => {
  const { rows } = await query(
    `SELECT p.*, e.name as employee_name, e.employee_id as emp_code
     FROM performance_reviews p
     JOIN employees e ON p.employee_id = e.id
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [id]
  );
  return rows[0];
};



/* ─── Employee Certifications ─────────────────────────────────── */
const addCertification = async (data) => {
  const { employeeId, name, authority, issuedDate, expiryDate, status, certificateUrl } = data;
  const { rows } = await query(
    `INSERT INTO employee_certifications (employee_id, name, authority, issued_date, expiry_date, status, certificate_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [employeeId, name, authority, issuedDate, expiryDate || null, status || 'Active', certificateUrl || null]
  );
  return rows[0];
};

const listCertifications = async (employeeId) => {
  const { rows } = await query(
    `SELECT c.*, e.name as employee_name, e.employee_id as emp_code
     FROM employee_certifications c
     JOIN employees e ON c.employee_id = e.id
     WHERE c.employee_id = $1 AND c.deleted_at IS NULL AND e.deleted_at IS NULL
     ORDER BY c.issued_date DESC`,
    [employeeId]
  );
  return rows;
};

const listAllCertifications = async () => {
  const { rows } = await query(
    `SELECT c.*, e.name as employee_name, e.employee_id as emp_code
     FROM employee_certifications c
     JOIN employees e ON c.employee_id = e.id
     WHERE c.deleted_at IS NULL AND e.deleted_at IS NULL
     ORDER BY c.issued_date DESC`
  );
  return rows;
};

const updateCertification = async (id, data) => {
  const { name, authority, issuedDate, expiryDate, status, certificateUrl } = data;
  const { rows } = await query(
    `UPDATE employee_certifications SET
       name = COALESCE($2, name),
       authority = COALESCE($3, authority),
       issued_date = COALESCE($4, issued_date),
       expiry_date = COALESCE($5, expiry_date),
       status = COALESCE($6, status),
       certificate_url = COALESCE($7, certificate_url),
       updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
    [id, name, authority, issuedDate, expiryDate, status, certificateUrl]
  );
  return rows[0];
};

const findCertificationById = async (id) => {
  const { rows } = await query(
    `SELECT c.*, e.name as employee_name, e.employee_id as emp_code
     FROM employee_certifications c
     JOIN employees e ON c.employee_id = e.id
     WHERE c.id = $1 AND c.deleted_at IS NULL`,
    [id]
  );
  return rows[0];
};

module.exports = {
  listEmployees, findById, nextEmployeeId, createEmployee,
  updateEmployee, patchStatus, softDelete, bulkSoftDelete, addDocument, listDocuments,
  addPerformanceReview, listPerformanceReviews, listAllPerformanceReviews, updatePerformanceReview, findPerformanceReviewById,
  addCertification, listCertifications, listAllCertifications, updateCertification, findCertificationById
};
