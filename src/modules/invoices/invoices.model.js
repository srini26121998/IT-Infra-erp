'use strict';
const { query, getClient } = require('../../db/pool');

const listInvoices = async ({ status, customerId, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  let sql = 'SELECT * FROM invoices WHERE deleted_at IS NULL';
  const params = [];

  if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
  if (customerId) { params.push(customerId); sql += ` AND customer_id = $${params.length}`; }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const { rows } = await query(sql, [...params, limit, offset]);
  return rows;
};

const findById = async (id) => {
  const { rows: invoice } = await query('SELECT * FROM invoices WHERE id = $1 AND deleted_at IS NULL', [id]);
  if (!invoice[0]) return null;
  const { rows: items } = await query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order ASC', [id]);
  const { rows: payments } = await query('SELECT * FROM invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC', [id]);
  return { ...invoice[0], items, payments };
};

const createInvoice = async (data) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { invoice_number, invoice_date, due_date, customer, seller, subtotal, tax_amount, discount, total_amount, payment_terms, notes, terms_conditions, items } = data;
    
    const { rows } = await client.query(`
      INSERT INTO invoices (
        invoice_number, invoice_date, due_date, customer_id, customer_name, customer_address, customer_email, customer_phone, customer_tax_id,
        seller_name, seller_address, seller_phone, seller_email, seller_tax_id, subtotal, tax_amount, discount, total_amount, balance_due, payment_terms, notes, terms_conditions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $18, $19, $20, $21) RETURNING *;
    `, [
      invoice_number, invoice_date, due_date, customer.id, customer.name, customer.address, customer.email, customer.phone, customer.tax_id,
      seller.name, seller.address, seller.phone, seller.email, seller.tax_id, subtotal, tax_amount, discount, total_amount, payment_terms, notes, terms_conditions
    ]);
    const inv = rows[0];

    for (const item of items) {
      await client.query(`
        INSERT INTO invoice_items (invoice_id, product_name, description, quantity, unit_price, discount, tax_percent, line_total, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [inv.id, item.product_name, item.description, item.quantity, item.unit_price, item.discount || 0, item.tax_percent || 0, item.line_total, item.sort_order || 0]);
    }

    await client.query('COMMIT');
    return inv;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const recordPayment = async (invoiceId, paymentData) => {
  const { payment_date, amount, payment_mode, reference_no, bank_name, transaction_id } = paymentData;
  
  const { rows: result } = await query(`
    WITH inserted AS (
      INSERT INTO invoice_payments (invoice_id, payment_date, amount, payment_mode, reference_no, bank_name, transaction_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    ),
    totals AS (
      SELECT invoice_id, SUM(amount) AS total_paid
      FROM invoice_payments WHERE invoice_id = $1 GROUP BY invoice_id
    )
    UPDATE invoices SET 
      amount_paid = totals.total_paid,
      balance_due = GREATEST(0, invoices.total_amount - totals.total_paid),
      status = CASE 
        WHEN totals.total_paid >= invoices.total_amount THEN 'Paid'
        WHEN totals.total_paid > 0 THEN 'Partially Paid'
        ELSE invoices.status
      END,
      updated_at = NOW()
    FROM totals WHERE invoices.id = totals.invoice_id
    RETURNING invoices.*;
  `, [invoiceId, payment_date, amount, payment_mode, reference_no, bank_name, transaction_id]);
  
  return result[0];
};

const updateStatus = async (id, status) => {
  const { rows } = await query('UPDATE invoices SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, status]);
  return rows[0];
};

module.exports = { listInvoices, findById, createInvoice, recordPayment, updateStatus };
