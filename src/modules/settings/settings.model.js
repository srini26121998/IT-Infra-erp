'use strict';
const { query } = require('../../db/pool');
const bcrypt = require('bcrypt');

/** ─── App Settings ─────────────────────────────────────────── */

const getSettings = async () => {
  const { rows } = await query('SELECT * FROM app_settings ORDER BY updated_at DESC LIMIT 1');
  return rows[0] || null;
};

const updateSettings = async (data) => {
  const { company_name, logo_url, currency, timezone, date_format, financial_year_start, smtp_config, approval_matrix, escalation_rules } = data;
  const { rows } = await query(`
    INSERT INTO app_settings (id, company_name, logo_url, currency, timezone, date_format, financial_year_start, smtp_config, approval_matrix, escalation_rules, updated_at)
    VALUES ((SELECT id FROM app_settings LIMIT 1), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (id) DO UPDATE SET 
      company_name = EXCLUDED.company_name, logo_url = EXCLUDED.logo_url, currency = EXCLUDED.currency, 
      timezone = EXCLUDED.timezone, date_format = EXCLUDED.date_format, financial_year_start = EXCLUDED.financial_year_start,
      smtp_config = EXCLUDED.smtp_config, approval_matrix = EXCLUDED.approval_matrix, escalation_rules = EXCLUDED.escalation_rules,
      updated_at = NOW()
    RETURNING *;
  `, [company_name, logo_url, currency, timezone, date_format, financial_year_start, smtp_config, approval_matrix, escalation_rules]);
  return rows[0];
};

/** ─── User Profile ─────────────────────────────────────────── */

const updateProfile = async (userId, { name }) => {
  const { rows } = await query('UPDATE users SET name = COALESCE($2, name), updated_at = NOW() WHERE id = $1 RETURNING id, name, email, role', [userId, name]);
  return rows[0];
};

const changePassword = async (userId, { oldPassword, newPassword }) => {
  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (!rows[0]) throw new Error('User not found');

  const valid = await bcrypt.compare(oldPassword, rows[0].password_hash);
  if (!valid) throw new Error('Invalid current password');

  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1', [userId, hash]);
  return true;
};

module.exports = { getSettings, updateSettings, updateProfile, changePassword };
