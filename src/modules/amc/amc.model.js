'use strict';
const { query } = require('../../db/pool');

/** ─── AMC Contracts ─────────────────────────────────────────── */

const listContracts = async ({ expiringSoon }) => {
  let sql = 'SELECT * FROM amc_contracts WHERE deleted_at IS NULL';
  if (expiringSoon) {
    sql += " AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'";
  }
  sql += ' ORDER BY end_date ASC';
  const { rows } = await query(sql);
  return rows;
};

const findById = async (id) => {
  const { rows } = await query('SELECT * FROM amc_contracts WHERE id = $1 AND deleted_at IS NULL', [id]);
  return rows[0] || null;
};

const createContract = async (data) => {
  const { amc_number, amc_name, customer, amc_type, number_of_units, start_date, end_date, total_amc_value, payment_frequency, response_time_sla, resolution_time_sla, penalty_per_hour, auto_renewal } = data;
  
  let finalAmcNumber = amc_number;
  if (!finalAmcNumber || finalAmcNumber.trim() === '') {
    const { rows: countRows } = await query('SELECT COUNT(*) FROM amc_contracts');
    const count = Number(countRows[0].count) + 1;
    
    let exists = true;
    let suffix = count;
    while (exists) {
      finalAmcNumber = `AMC-${new Date().getFullYear()}-${suffix.toString().padStart(4, '0')}`;
      const { rows: checkRows } = await query('SELECT id FROM amc_contracts WHERE amc_number = $1 LIMIT 1', [finalAmcNumber]);
      if (checkRows.length === 0) {
        exists = false;
      } else {
        suffix++;
      }
    }
  }

  const { rows } = await query(`
    INSERT INTO amc_contracts (amc_number, amc_name, customer, amc_type, number_of_units, start_date, end_date, total_amc_value, payment_frequency, response_time_sla, resolution_time_sla, penalty_per_hour, auto_renewal)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *;
  `, [finalAmcNumber, amc_name, customer, amc_type, number_of_units || 1, start_date, end_date, total_amc_value, payment_frequency, response_time_sla, resolution_time_sla, penalty_per_hour || 0, auto_renewal || false]);
  return rows[0];
};

const updateContract = async (id, data) => {
  const { amc_name, customer, amc_type, number_of_units, start_date, end_date, total_amc_value, payment_frequency, response_time_sla, resolution_time_sla, penalty_per_hour, auto_renewal, status } = data;
  const { rows } = await query(`
    UPDATE amc_contracts SET
      amc_name = COALESCE($2, amc_name),
      customer = COALESCE($3, customer),
      amc_type = COALESCE($4, amc_type),
      number_of_units = COALESCE($5, number_of_units),
      start_date = COALESCE($6, start_date),
      end_date = COALESCE($7, end_date),
      total_amc_value = COALESCE($8, total_amc_value),
      payment_frequency = COALESCE($9, payment_frequency),
      response_time_sla = COALESCE($10, response_time_sla),
      resolution_time_sla = COALESCE($11, resolution_time_sla),
      penalty_per_hour = COALESCE($12, penalty_per_hour),
      auto_renewal = COALESCE($13, auto_renewal),
      status = COALESCE($14, status),
      updated_at = NOW()
    WHERE id = $1 RETURNING *;
  `, [id, amc_name, customer, amc_type, number_of_units, start_date, end_date, total_amc_value, payment_frequency, response_time_sla, resolution_time_sla, penalty_per_hour, auto_renewal, status]);
  return rows[0];
};

const getPenaltyReport = async () => {
  const { rows } = await query(`
    SELECT ac.amc_number, ac.amc_name, 
           SUM(st.penalty_hours * ac.penalty_per_hour) AS total_penalty
    FROM amc_service_tickets st
    JOIN amc_contracts ac ON ac.id = st.amc_id
    WHERE st.status = 'Resolved'
    GROUP BY ac.id ORDER BY total_penalty DESC;
  `);
  return rows;
};

/** ─── Service Tickets ───────────────────────────────────────── */

const listTickets = async (amcId) => {
  const { rows } = await query(`
    SELECT st.*, ac.amc_name, ac.amc_number, ac.customer
    FROM amc_service_tickets st
    JOIN amc_contracts ac ON ac.id = st.amc_id
    WHERE ($1::UUID IS NULL OR st.amc_id = $1)
    ORDER BY st.created_at DESC;
  `, [amcId || null]);
  return rows;
};

const createTicket = async (data) => {
  const { ticket_number, amc_id, call_date_time, call_type, equipment_unit, reported_by, contact_number, problem_description, priority, assigned_to, response_due_by, resolution_due_by } = data;
  const { rows } = await query(`
    INSERT INTO amc_service_tickets (ticket_number, amc_id, call_date_time, call_type, equipment_unit, reported_by, contact_number, problem_description, priority, assigned_to, response_due_by, resolution_due_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;
  `, [ticket_number, amc_id, call_date_time, call_type, equipment_unit, reported_by, contact_number, problem_description, priority, assigned_to, response_due_by, resolution_due_by]);
  return rows[0];
};

const findTicketById = async (id) => {
  const { rows } = await query(`
    SELECT st.*, ac.amc_name, ac.amc_number, ac.customer
    FROM amc_service_tickets st
    JOIN amc_contracts ac ON ac.id = st.amc_id
    WHERE st.id = $1;
  `, [id]);
  return rows[0] || null;
};

const updateTicketStatus = async (id, status, actualTime) => {
  const { rows } = await query(`
    UPDATE amc_service_tickets 
    SET status = $2, resolution_actual_datetime = $3, updated_at = NOW() 
    WHERE id = $1 RETURNING *;
  `, [id, status, actualTime || null]);
  return rows[0];
};

module.exports = { listContracts, findById, createContract, updateContract, getPenaltyReport, listTickets, findTicketById, createTicket, updateTicketStatus };
