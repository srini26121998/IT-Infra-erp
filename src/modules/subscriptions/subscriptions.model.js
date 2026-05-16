'use strict';
const { query } = require('../../db/pool');

/** ─── Subscriptions ────────────────────────────────────────── */

const list = async ({ status, paymentType, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { rows } = await query(`
    SELECT * FROM subscriptions
    WHERE deleted_at IS NULL
    AND ($1::TEXT IS NULL OR status = $1)
    AND ($2::TEXT IS NULL OR payment_type = $2)
    ORDER BY created_at DESC
    LIMIT $3 OFFSET $4;
  `, [status || null, paymentType || null, limit, offset]);

  const countRes = await query(`
    SELECT COUNT(*) FROM subscriptions 
    WHERE deleted_at IS NULL 
    AND ($1::TEXT IS NULL OR status = $1)
    AND ($2::TEXT IS NULL OR payment_type = $2)
  `, [status || null, paymentType || null]);

  return { rows, total: Number(countRes.rows[0].count) };
};

const findById = async (id) => {
  const { rows } = await query('SELECT * FROM subscriptions WHERE id = $1 AND deleted_at IS NULL', [id]);
  return rows[0] || null;
};

const create = async (data) => {
  const { name, provider, plan, notes } = data;
  const paymentType = data.paymentType || data.payment_type;
  const customerName = data.customerName || data.customer_name;
  const customerEmail = data.customerEmail || data.customer_email;
  const customerPhone = data.customerPhone || data.customer_phone;
  const startDate = data.startDate || data.start_date;
  const endDate = data.endDate || data.end_date;
  const durationYears = data.durationYears || data.duration_years;
  const autoRenew = data.autoRenew !== undefined ? data.autoRenew : data.auto_renew;
  const monthlyCost = data.monthlyCost || data.monthly_cost;
  const totalCost = data.totalCost || data.total_cost;
  const maintenancePeriod = data.maintenancePeriod || data.maintenance_period;
  const assetDescription = data.assetDescription || data.asset_description;

  // Calculate endDate if missing
  let calculatedEndDate = endDate;
  if (!calculatedEndDate && startDate && durationYears) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setFullYear(start.getFullYear() + Number(durationYears));
    calculatedEndDate = end.toISOString().split('T')[0];
  }

  // Calculate totalCost if missing
  let calculatedTotalCost = totalCost;
  if (!calculatedTotalCost && monthlyCost && durationYears) {
    calculatedTotalCost = Number(monthlyCost) * 12 * Number(durationYears);
  }

  const { rows } = await query(`
    INSERT INTO subscriptions (name, provider, plan, payment_type, customer_name, customer_email, customer_phone, start_date, end_date, duration_years, auto_renew, monthly_cost, total_cost, maintenance_period, asset_description, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *;
  `, [
    name, provider, plan, paymentType, customerName, customerEmail, customerPhone, 
    startDate, calculatedEndDate, durationYears || 1, autoRenew || false, 
    monthlyCost, calculatedTotalCost, maintenancePeriod, assetDescription, notes
  ]);
  return rows[0];
};

const update = async (id, data) => {
  const { name, provider, plan, status, notes } = data;
  const paymentType = data.paymentType || data.payment_type;
  const customerName = data.customerName || data.customer_name;
  const customerEmail = data.customerEmail || data.customer_email;
  const customerPhone = data.customerPhone || data.customer_phone;
  const startDate = data.startDate || data.start_date;
  const endDate = data.endDate || data.end_date;
  const durationYears = data.durationYears || data.duration_years;
  const autoRenew = data.autoRenew !== undefined ? data.autoRenew : data.auto_renew;
  const monthlyCost = data.monthlyCost || data.monthly_cost;
  const totalCost = data.totalCost || data.total_cost;
  const renewalStatus = data.renewalStatus || data.renewal_status;
  const maintenancePeriod = data.maintenancePeriod || data.maintenance_period;
  const assetDescription = data.assetDescription || data.asset_description;

  const { rows } = await query(`
    UPDATE subscriptions SET 
      name = $2, provider = $3, plan = $4, payment_type = $5, customer_name = $6, customer_email = $7, customer_phone = $8, 
      start_date = $9, end_date = $10, duration_years = $11, auto_renew = $12, monthly_cost = $13, total_cost = $14, 
      status = $15, renewal_status = $16, maintenance_period = $17, asset_description = $18, notes = $19, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL RETURNING *;
  `, [
    id, name, provider, plan, paymentType, customerName, customerEmail, customerPhone, 
    startDate, endDate, durationYears, autoRenew, monthlyCost, totalCost, 
    status, renewalStatus, maintenancePeriod, assetDescription, notes
  ]);
  return rows[0];
};

const renew = async (id) => {
  const { rows } = await query(`
    UPDATE subscriptions 
    SET end_date = end_date + (duration_years || ' years')::INTERVAL,
        status = 'ACTIVE', 
        renewal_status = 'RENEWED', 
        updated_at = NOW()
    WHERE id = $1 RETURNING *;
  `, [id]);
  return rows[0];
};

const softDelete = async (id) => {
  const { rowCount } = await query('UPDATE subscriptions SET deleted_at = NOW() WHERE id = $1', [id]);
  return rowCount > 0;
};

/** ─── Plans ─────────────────────────────────────────────────── */

const listPlans = async () => {
  const { rows } = await query('SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY price_monthly ASC');
  return rows;
};

/** ─── Transactions ─────────────────────────────────────────── */

const findTransactionByOrderId = async (orderId) => {
  const { rows } = await query('SELECT id FROM subscription_transactions WHERE order_id = $1', [orderId]);
  return rows[0] || null;
};

const createTransaction = async (data) => {
  const { subscriptionId, transactionId, orderId, amount, status, gatewayResponse } = data;
  const { rows } = await query(`
    INSERT INTO subscription_transactions (subscription_id, transaction_id, order_id, amount, status, gateway_response)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
  `, [subscriptionId, transactionId, orderId, amount, status, gatewayResponse]);
  return rows[0];
};

/** ─── Expiry Cron Logic ──────────────────────────────────────── */

const runExpiryChecks = async () => {
  // Mark EXPIRING_SOON
  await query(`
    UPDATE subscriptions SET status = 'EXPIRING_SOON', updated_at = NOW()
    WHERE status = 'ACTIVE'
    AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND deleted_at IS NULL;
  `);

  // Mark EXPIRED
  const { rows } = await query(`
    UPDATE subscriptions SET status = 'EXPIRED', updated_at = NOW()
    WHERE status NOT IN ('EXPIRED')
    AND end_date < CURRENT_DATE
    AND deleted_at IS NULL
    RETURNING *;
  `);
  return rows;
};

module.exports = { 
  list, findById, create, update, renew, softDelete,
  listPlans, findTransactionByOrderId, createTransaction, runExpiryChecks 
};
