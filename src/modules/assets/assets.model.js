'use strict';
const { query } = require('../../db/pool');

/** ─── Employee Assets ───────────────────────────────────────── */

const listEmployeeAssets = async (employeeId) => {
  const { rows } = await query(`
    SELECT ea.*, e.name AS employee_name, e.employee_id AS emp_code
    FROM employee_assets ea
    JOIN employees e ON e.id = ea.employee_id
    WHERE ea.deleted_at IS NULL
    AND ($1::UUID IS NULL OR ea.employee_id = $1)
    ORDER BY ea.distributed_on DESC;
  `, [employeeId || null]);
  return rows;
};

const resolveEmployeeId = async (idOrCode) => {
  if (!idOrCode) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode)) return idOrCode;

  const { rows } = await query('SELECT id FROM employees WHERE employee_id = $1 AND deleted_at IS NULL', [idOrCode]);
  return rows[0]?.id || null;
};

const allocateAsset = async (data) => {
  const { 
    tag, name, category, 
    employeeId, employee_id, 
    distributedOn, distributed_on, 
    status, notes,
    processor, memory, storage, network, encryption
  } = data;

  const resolvedEmployeeId = await resolveEmployeeId(employeeId || employee_id);
  const distOn = distributedOn || distributed_on;

  const { rows } = await query(`
    INSERT INTO employee_assets (
      tag, name, category, employee_id, distributed_on, status, notes,
      processor, memory, storage, network, encryption
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;
  `, [
    tag, name, category, resolvedEmployeeId, distOn, status || 'Active', notes,
    processor || null, memory || null, storage || null, network || null, encryption || null
  ]);

  if (rows[0]) {
    await query(`
      INSERT INTO asset_allocations_history (asset_id, employee_id, action, notes, action_date)
      VALUES ($1, $2, $3, $4, $5)
    `, [rows[0].id, resolvedEmployeeId, 'Assigned', 'Initial Allocation', distOn]);
  }

  return rows[0];
};

const updateAllocation = async (id, data) => {
  const { 
    tag, name, category, 
    employeeId, employee_id, 
    distributedOn, distributed_on, 
    returnedOn, returned_on, 
    status, notes,
    processor, memory, storage, network, encryption
  } = data;

  const resolvedEmployeeId = await resolveEmployeeId(employeeId || employee_id);
  const distOn = distributedOn || distributed_on;
  const retOn = returnedOn || returned_on;

  const { rows } = await query(`
    UPDATE employee_assets SET 
      tag = $2, name = $3, category = $4, employee_id = $5, 
      distributed_on = $6, returned_on = $7, status = $8, notes = $9,
      processor = $10, memory = $11, storage = $12, network = $13, encryption = $14,
      updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL RETURNING *;
  `, [
    id, tag, name, category, resolvedEmployeeId, distOn, retOn || null, status || 'Active', notes,
    processor || null, memory || null, storage || null, network || null, encryption || null
  ]);

  if (rows[0]) {
    await query(`
      INSERT INTO asset_allocations_history (asset_id, employee_id, action, notes, action_date)
      VALUES ($1, $2, $3, $4, $5)
    `, [rows[0].id, resolvedEmployeeId, status === 'Active' ? 'Re-Assigned/Updated' : status, notes || 'Status Updated', retOn || distOn || new Date()]);
  }

  return rows[0];
};

const softDeleteAllocation = async (id) => {
  const { rowCount } = await query('UPDATE employee_assets SET deleted_at = NOW() WHERE id = $1', [id]);
  return rowCount > 0;
};

const getEmployeeAssetById = async (id) => {
  const { rows } = await query(`
    SELECT ea.*, e.name AS employee_name, e.employee_id AS emp_code
    FROM employee_assets ea
    JOIN employees e ON e.id = ea.employee_id
    WHERE ea.id = $1 AND ea.deleted_at IS NULL;
  `, [id]);
  return rows[0];
};

const getAssetHistory = async (assetId) => {
  const { rows } = await query(`
    SELECT h.*, e.name AS employee_name, e.employee_id AS emp_code
    FROM asset_allocations_history h
    JOIN employees e ON e.id = h.employee_id
    WHERE h.asset_id = $1
    ORDER BY h.action_date DESC, h.created_at DESC;
  `, [assetId]);
  return rows;
};

/** ─── Company Assets ────────────────────────────────────────── */

const listCompanyAssets = async (filters = {}) => {
  const { category, status, expiringSoon } = filters;
  let sql = 'SELECT * FROM company_assets WHERE deleted_at IS NULL';
  const params = [];

  if (category) { params.push(category); sql += ` AND category = $${params.length}`; }
  if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
  
  if (expiringSoon) {
    sql += " AND warranty_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'";
  }

  sql += ' ORDER BY created_at DESC';
  const { rows } = await query(sql, params);
  return rows;
};

const addCompanyAsset = async (data) => {
  const { 
    name, category, quantity, 
    purchaseDate, purchase_date,
    warrantyExpiry, warranty_expiry,
    subscriptionPlan, subscription_plan,
    billingCycle, billing_cycle,
    monthlyCost, monthly_cost,
    annualCost, annual_cost,
    totalSpent, total_spent,
    activationDate, activation_date,
    renewalDate, renewal_date,
    companyName, company_name,
    email, phoneNumber, phone_number, address
  } = data;

  const pDate = purchaseDate || purchase_date;
  const wExp = warrantyExpiry || warranty_expiry;
  const sPlan = subscriptionPlan || subscription_plan;
  const bCycle = billingCycle || billing_cycle;
  const mCost = monthlyCost || monthly_cost;
  const aCost = annualCost || annual_cost;
  const tSpent = totalSpent || total_spent;
  const aDate = activationDate || activation_date;
  const rDate = renewalDate || renewal_date;
  const cName = companyName || company_name;
  const pNum = phoneNumber || phone_number;

  const { rows } = await query(`
    INSERT INTO company_assets (
      name, category, quantity, purchase_date, warranty_expiry, 
      subscription_plan, billing_cycle, monthly_cost, annual_cost, 
      total_spent, activation_date, renewal_date, 
      company_name, email, phone_number, address
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *;
  `, [
    name, category, quantity || 1, pDate, wExp, 
    sPlan, bCycle, mCost || 0, aCost || 0, 
    tSpent || 0, aDate, rDate,
    cName, email, pNum, address
  ]);
  return rows[0];
};

const updateCompanyAsset = async (id, data) => {
  const { 
    name, category, quantity, 
    purchaseDate, purchase_date,
    warrantyExpiry, warranty_expiry,
    subscriptionPlan, subscription_plan,
    billingCycle, billing_cycle,
    monthlyCost, monthly_cost,
    annualCost, annual_cost,
    totalSpent, total_spent,
    activationDate, activation_date,
    renewalDate, renewal_date,
    status,
    companyName, company_name,
    email, phoneNumber, phone_number, address
  } = data;

  const pDate = purchaseDate || purchase_date;
  const wExp = warrantyExpiry || warranty_expiry;
  const sPlan = subscriptionPlan || subscription_plan;
  const bCycle = billingCycle || billing_cycle;
  const mCost = monthlyCost || monthly_cost;
  const aCost = annualCost || annual_cost;
  const tSpent = totalSpent || total_spent;
  const aDate = activationDate || activation_date;
  const rDate = renewalDate || renewal_date;
  const cName = companyName || company_name;
  const pNum = phoneNumber || phone_number;

  const { rows } = await query(`
    UPDATE company_assets SET 
      name = $2, category = $3, quantity = $4, purchase_date = $5, warranty_expiry = $6, 
      subscription_plan = $7, billing_cycle = $8, monthly_cost = $9, annual_cost = $10, 
      total_spent = $11, activation_date = $12, renewal_date = $13, status = $14,
      company_name = $15, email = $16, phone_number = $17, address = $18,
      updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL RETURNING *;
  `, [
    id, name, category, quantity, pDate, wExp, 
    sPlan, bCycle, mCost, aCost, 
    tSpent, aDate, rDate, status,
    cName, email, pNum, address
  ]);
  return rows[0];
};

const softDeleteCompanyAsset = async (id) => {
  const { rowCount } = await query('UPDATE company_assets SET deleted_at = NOW() WHERE id = $1', [id]);
  return rowCount > 0;
};

const getCompanyAssetById = async (id) => {
  const { rows } = await query('SELECT * FROM company_assets WHERE id = $1 AND deleted_at IS NULL;', [id]);
  return rows[0];
};

const deactivateCompanyAsset = async (id) => {
  const { rowCount } = await query("UPDATE company_assets SET status = 'Decommissioned' WHERE id = $1", [id]);
  return rowCount > 0;
};

module.exports = {
  listEmployeeAssets, allocateAsset, updateAllocation, softDeleteAllocation, getEmployeeAssetById, getAssetHistory,
  listCompanyAssets, addCompanyAsset, updateCompanyAsset, softDeleteCompanyAsset, getCompanyAssetById, deactivateCompanyAsset
};
