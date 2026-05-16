'use strict';
const { query } = require('../../db/pool');

const getSummary = async () => {
  const { rows } = await query(`
    SELECT 
      SUM(total_invoice_value) AS total_revenue,
      SUM(CASE WHEN status != 'Paid' THEN net_bill_amount ELSE 0 END) AS wip,
      AVG(work_completion_percentage) AS avg_poc,
      SUM(retention_amount) AS retention_receivable
    FROM ra_bills WHERE deleted_at IS NULL;
  `);
  return rows[0];
};

const listRaBills = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { rows } = await query(`
    SELECT rb.*, c.contract_name 
    FROM ra_bills rb
    JOIN contracts c ON c.id = rb.contract_id
    WHERE rb.deleted_at IS NULL
    ORDER BY rb.bill_date DESC LIMIT $1 OFFSET $2;
  `, [limit, offset]);
  return rows;
};

const findById = async (id) => {
  const { rows } = await query('SELECT * FROM ra_bills WHERE id = $1 AND deleted_at IS NULL', [id]);
  return rows[0] || null;
};

const createRaBill = async (data) => {
  const { 
    bill_number, contract_id, bill_period, bill_date, 
    work_completion_percentage, gross_amount, previous_bills_amount, 
    advance_deduction, retention_amount, gst_percentage, 
    cgst_amount, sgst_amount, tds_percentage, total_invoice_value,
    status = 'Draft'
  } = data;

  // Calculate net_bill_amount for TDS calculation (though it's generated in DB, we need it here)
  const net_amt = Number(gross_amount || 0) - Number(previous_bills_amount || 0) - 
                  Number(advance_deduction || 0) - Number(retention_amount || 0);
  
  // Calculate tds_amount if not provided
  const tds_amount = data.tds_amount !== undefined ? data.tds_amount : (net_amt * (Number(tds_percentage || 0) / 100));

  const { rows } = await query(`
    INSERT INTO ra_bills (
      bill_number, contract_id, bill_period, bill_date, work_completion_percentage, 
      gross_amount, previous_bills_amount, advance_deduction, retention_amount, 
      gst_percentage, cgst_amount, sgst_amount, tds_percentage, tds_amount, 
      total_invoice_value, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
    RETURNING *;
  `, [
    bill_number, contract_id, bill_period, bill_date, Number(work_completion_percentage || 0), 
    Number(gross_amount || 0), Number(previous_bills_amount || 0), Number(advance_deduction || 0), 
    Number(retention_amount || 0), Number(gst_percentage || 0), Number(cgst_amount || 0), 
    Number(sgst_amount || 0), Number(tds_percentage || 0), Number(tds_amount || 0), 
    Number(total_invoice_value || 0), status
  ]);
  return rows[0];
};

const updateRaBill = async (id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  Object.keys(data).forEach(key => {
    if (['id', 'created_at', 'updated_at', 'deleted_at', 'net_bill_amount'].includes(key)) return;
    fields.push(`${key} = $${idx++}`);
    values.push(data[key]);
  });

  if (fields.length === 0) return findById(id);

  values.push(id);
  const { rows } = await query(`
    UPDATE ra_bills 
    SET ${fields.join(', ')}, updated_at = NOW() 
    WHERE id = $${idx} AND deleted_at IS NULL 
    RETURNING *;
  `, values);
  
  return rows[0];
};

const authorizeBill = async (id) => {
  const { rows } = await query(`
    UPDATE ra_bills 
    SET status = 'Authorized', updated_at = NOW() 
    WHERE id = $1 AND deleted_at IS NULL 
    RETURNING *;
  `, [id]);
  return rows[0];
};

const getTrend = async () => {
  const { rows } = await query(`
    SELECT 
      DATE_TRUNC('month', bill_date) AS month,
      SUM(total_invoice_value) AS revenue,
      COUNT(*) AS bill_count
    FROM ra_bills 
    WHERE deleted_at IS NULL
    GROUP BY month 
    ORDER BY month DESC 
    LIMIT 12;
  `);
  return rows;
};

module.exports = { 
  getSummary, 
  listRaBills, 
  findById, 
  createRaBill, 
  updateRaBill, 
  authorizeBill, 
  getTrend 
};
