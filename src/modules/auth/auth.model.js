'use strict';
const { query } = require('../../db/pool');

/* ── Users ───────────────────────────────────────────────── */

const findUserByEmailOrUsername = async (identifier) => {
  const { rows } = await query(
    `SELECT id, name, email, password_hash, role, employee_id, company_id, is_active
       FROM users
      WHERE (email = $1 OR username = $1)
        AND deleted_at IS NULL`,
    [identifier]
  );
  return rows[0] || null;
};

const findUserById = async (id) => {
  const { rows } = await query(
    `SELECT id, name, email, role, employee_id, company_id, is_active, last_login
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
};

const findUserByEmail = async (email) => {
  const { rows } = await query(
    `SELECT id, name, email, role, is_active
       FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  );
  return rows[0] || null;
};

const createUser = async ({ name, email, username, passwordHash, role = 'employee', companyId }) => {
  const { rows } = await query(
    `INSERT INTO users (name, email, username, password_hash, role, company_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, role`,
    [name, email, username || null, passwordHash, role, companyId || null]
  );
  return rows[0];
};

const updateLastLogin = async (userId) =>
  query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);

const updatePasswordHash = async (email, hash) =>
  query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 AND deleted_at IS NULL',
    [hash, email]
  );

/* ── Refresh tokens ──────────────────────────────────────── */

const storeRefreshToken = async (userId, tokenHash, expiresAt) =>
  query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

const findRefreshToken = async (tokenHash) => {
  const { rows } = await query(
    `SELECT id, user_id, expires_at, revoked
       FROM refresh_tokens
      WHERE token_hash = $1`,
    [tokenHash]
  );
  return rows[0] || null;
};

const revokeRefreshToken = async (tokenHash, userId) =>
  query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1 AND user_id = $2',
    [tokenHash, userId]
  );

const revokeAllUserTokens = async (userId) =>
  query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [userId]);

/* ── OTP tokens ──────────────────────────────────────────── */

const storeOtpToken = async (email, otpHash, type, expiresAt) =>
  query(
    `INSERT INTO otp_tokens (email, otp_hash, type, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [email, otpHash, type, expiresAt]
  );

const findValidOtp = async (email, otpHash, type) => {
  const { rows } = await query(
    `SELECT id FROM otp_tokens
      WHERE email = $1 AND otp_hash = $2 AND type = $3
        AND used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1`,
    [email, otpHash, type]
  );
  return rows[0] || null;
};

const markOtpUsed = async (id) =>
  query('UPDATE otp_tokens SET used = TRUE WHERE id = $1', [id]);

module.exports = {
  findUserByEmailOrUsername,
  findUserById,
  findUserByEmail,
  createUser,
  updateLastLogin,
  updatePasswordHash,
  storeRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  storeOtpToken,
  findValidOtp,
  markOtpUsed,
};
