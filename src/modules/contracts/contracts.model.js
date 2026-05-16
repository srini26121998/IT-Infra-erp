'use strict';
const { query } = require('../../db/pool');

const listContracts = async ({ status, client, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT c.*, 
           COALESCE(SUM(rb.total_invoice_value), 0) AS total_billed,
           c.contract_value - COALESCE(SUM(rb.total_invoice_value), 0) AS remaining
    FROM contracts c
    LEFT JOIN ra_bills rb ON rb.contract_id = c.id
    WHERE c.deleted_at IS NULL
  `;
  const params = [];

  if (status) {
    params.push(status);
    sql += ` AND c.status = $${params.length}`;
  }
  if (client) {
    params.push(`%${client}%`);
    sql += ` AND c.client ILIKE $${params.length}`;
  }

  sql += ` GROUP BY c.id ORDER BY c.contract_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const { rows } = await query(sql, [...params, limit, offset]);
  return rows;
};

const findById = async (id) => {
  const { rows } = await query('SELECT * FROM contracts WHERE id = $1 AND deleted_at IS NULL', [id]);
  return rows[0] || null;
};

const createContract = async (data) => {
  const contractName = data.contract_name || data.contractName;
  const contractType = data.contract_type || data.contractType;
  const client = data.client;
  const contractValue = data.contract_value || data.contractValue;
  const contractDate = data.contract_date || data.contractDate;
  const startDate = data.start_date || data.startDate;
  const endDate = data.end_date || data.endDate;
  const projectManager = data.project_manager || data.projectManager;
  const paymentTerms = data.payment_terms || data.paymentTerms;
  const retentionPercentage = data.retention_percentage || data.retentionPercentage || 0;
  const mobilizationAdvPercentage = data.mobilization_adv_percentage || data.mobilizationAdvPercentage || 0;
  const escalationClause = data.escalation_clause || data.escalationClause || false;
  const penaltyClause = data.penalty_clause || data.penaltyClause || false;
  const location = data.location || ['Default'];
  const status = data.status || 'Draft';
  
  const { rows } = await query(`
    INSERT INTO contracts (
      contract_number, contract_name, contract_type, client, contract_value, contract_date, 
      start_date, end_date, project_manager, payment_terms, retention_percentage, 
      mobilization_adv_percentage, escalation_clause, penalty_clause, location, status
    )
    VALUES (
      'CTR-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((SELECT COUNT(*)+1 FROM contracts WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()))::TEXT, 3, '0'),
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    ) RETURNING *;
  `, [
    contractName, contractType, client, contractValue, contractDate, 
    startDate, endDate, projectManager, paymentTerms, retentionPercentage, 
    mobilizationAdvPercentage, escalationClause, penaltyClause, location, status
  ]);
  
  return rows[0];
};

const updateContract = async (id, data) => {
  const contractName = data.contract_name || data.contractName;
  const contractType = data.contract_type || data.contractType;
  const client = data.client;
  const contractValue = data.contract_value || data.contractValue;
  const contractDate = data.contract_date || data.contractDate;
  const startDate = data.start_date || data.startDate;
  const endDate = data.end_date || data.endDate;
  const projectManager = data.project_manager || data.projectManager;
  const paymentTerms = data.payment_terms || data.paymentTerms;
  const retentionPercentage = data.retention_percentage || data.retentionPercentage;
  const mobilizationAdvPercentage = data.mobilization_adv_percentage || data.mobilizationAdvPercentage;
  const escalationClause = data.escalation_clause !== undefined ? data.escalation_clause : data.escalationClause;
  const penaltyClause = data.penalty_clause !== undefined ? data.penalty_clause : data.penaltyClause;
  const location = data.location;
  const status = data.status;

  const { rows } = await query(`
    UPDATE contracts SET 
      contract_name = $2, contract_type = $3, client = $4, contract_value = $5, contract_date = $6, 
      start_date = $7, end_date = $8, project_manager = $9, payment_terms = $10, 
      retention_percentage = $11, mobilization_adv_percentage = $12, escalation_clause = $13, 
      penalty_clause = $14, location = $15, status = $16, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL RETURNING *;
  `, [
    id, contractName, contractType, client, contractValue, contractDate, 
    startDate, endDate, projectManager, paymentTerms, retentionPercentage, 
    mobilizationAdvPercentage, escalationClause, penaltyClause, location, status
  ]);
  return rows[0];
};

const advanceStatus = async (id, newStatus, prevStatus) => {
  const { rows } = await query(`
    UPDATE contracts SET status = $2, updated_at = NOW()
    WHERE id = $1 AND status = $3 RETURNING *;
  `, [id, newStatus, prevStatus]);
  return rows[0];
};

const softDelete = async (id) => {
  const { rowCount } = await query('UPDATE contracts SET deleted_at = NOW() WHERE id = $1', [id]);
  return rowCount > 0;
};

module.exports = { listContracts, findById, createContract, updateContract, advanceStatus, softDelete };
