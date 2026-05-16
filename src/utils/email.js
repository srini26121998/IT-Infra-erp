'use strict';
const nodemailer = require('nodemailer');
const { query } = require('../db/pool');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send an email and log it to the database.
 */
const sendEmail = async ({ to, subject, html, type, subscriptionId, invoiceId }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html
    });

    await query(`
      INSERT INTO email_logs (type, recipient_email, subject, body_html, subscription_id, invoice_id, provider_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent')
    `, [type, to, subject, html, subscriptionId || null, invoiceId || null, info.messageId]);

    return info;
  } catch (e) {
    console.error('Email Service Error:', e.message);
    
    await query(`
      INSERT INTO email_logs (type, recipient_email, subject, body_html, subscription_id, invoice_id, status, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, 'failed', $7)
    `, [type, to, subject, html, subscriptionId || null, invoiceId || null, e.message]);
    
    throw e;
  }
};

module.exports = { sendEmail };
