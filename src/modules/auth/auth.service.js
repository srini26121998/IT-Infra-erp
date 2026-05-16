'use strict';
const bcrypt    = require('bcrypt');
const crypto    = require('crypto');
const {
  signAccessToken, signRefreshToken, verifyRefreshToken,
} = require('../../utils/jwt');
const { sendOtpEmail } = require('../../utils/mailer');
const model = require('./auth.model');

const SALT_ROUNDS = 12;
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES) || 10;

// ── Helpers ──────────────────────────────────────────────────

/** Hash a plain string with sha256 (for tokens/OTPs stored in DB) */
const sha256 = (str) => crypto.createHash('sha256').update(str).digest('hex');

/** Generate a cryptographically random 6-digit OTP */
const generateOtp = () =>
  String(crypto.randomInt(100_000, 999_999));

/** Build a Date object N minutes from now */
const minutesFromNow = (n) => new Date(Date.now() + n * 60_000);

/** Build a Date object N days from now */
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 3600_000);

// ── Service methods ──────────────────────────────────────────

/**
 * Login — authenticate user, issue access + refresh tokens.
 */
const login = async (identifier, plainPassword) => {
  const user = await model.findUserByEmailOrUsername(identifier);
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  if (!user.is_active) throw Object.assign(new Error('Account is inactive'), { status: 403 });

  const match = await bcrypt.compare(plainPassword, user.password_hash);
  if (!match) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  await model.updateLastLogin(user.id);

  const accessToken  = signAccessToken({
    id: user.id,
    role: user.role,
    email: user.email,
    companyId: user.company_id,
    employeeId: user.employee_id
  });
  const refreshToken = signRefreshToken({ id: user.id });

  // Store hashed refresh token
  await model.storeRefreshToken(
    user.id,
    sha256(refreshToken),
    daysFromNow(7)
  );

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

/**
 * Logout — revoke the provided refresh token.
 */
const logout = async (userId, refreshToken) => {
  await model.revokeRefreshToken(sha256(refreshToken), userId);
};

/**
 * Refresh — rotate access token using a valid refresh token.
 */
const refresh = async (refreshToken) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  const stored = await model.findRefreshToken(sha256(refreshToken));
  if (!stored || stored.revoked || new Date(stored.expires_at) < new Date()) {
    throw Object.assign(new Error('Refresh token revoked or expired'), { status: 401 });
  }

  const user = await model.findUserById(payload.id);
  if (!user || !user.is_active) {
    throw Object.assign(new Error('User not found or inactive'), { status: 401 });
  }

  // Rotate — revoke old, issue new pair
  await model.revokeRefreshToken(sha256(refreshToken), user.id);
  const newAccess  = signAccessToken({
    id: user.id,
    role: user.role,
    email: user.email,
    companyId: user.company_id,
    employeeId: user.employee_id
  });
  const newRefresh = signRefreshToken({ id: user.id });
  await model.storeRefreshToken(user.id, sha256(newRefresh), daysFromNow(7));

  return { accessToken: newAccess, refreshToken: newRefresh };
};

/**
 * Signup — company self-registration, sends OTP for verification.
 */
const signup = async ({ name, email, username, password, companyId }) => {
  const existing = await model.findUserByEmail(email);
  if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await model.createUser({ name, email, username, passwordHash, role: 'company', companyId });

  // Send email verification OTP
  const otp = generateOtp();
  await model.storeOtpToken(email, sha256(otp), 'signup', minutesFromNow(OTP_EXPIRES_MINUTES));
  await sendOtpEmail(email, otp, 'signup');

  return { id: user.id, name: user.name, email: user.email };
};

/**
 * Forgot password — sends OTP to email.
 */
const forgotPassword = async (email) => {
  const user = await model.findUserByEmail(email);
  // Silent fail to avoid email enumeration
  if (!user) return;

  const otp = generateOtp();
  await model.storeOtpToken(email, sha256(otp), 'forgot_password', minutesFromNow(OTP_EXPIRES_MINUTES));
  await sendOtpEmail(email, otp, 'forgot_password');
};

/**
 * Verify OTP — returns a short-lived reset token on success.
 */
const verifyOtp = async (email, otp, type) => {
  const record = await model.findValidOtp(email, sha256(otp), type);
  if (!record) throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });

  await model.markOtpUsed(record.id);

  // Issue a one-time reset token (15 min)
  const resetToken = crypto.randomBytes(32).toString('hex');
  // We reuse storeOtpToken as a "reset token" with type reset_token
  await model.storeOtpToken(email, sha256(resetToken), 'reset_token', minutesFromNow(15));

  return { resetToken };
};

/**
 * Reset password — set new password using a valid reset token.
 */
const resetPassword = async (email, resetToken, newPassword) => {
  const record = await model.findValidOtp(email, sha256(resetToken), 'reset_token');
  if (!record) throw Object.assign(new Error('Invalid or expired reset token'), { status: 400 });

  await model.markOtpUsed(record.id);
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await model.updatePasswordHash(email, hash);

  // Revoke all refresh tokens for security
  const user = await model.findUserByEmail(email);
  if (user) await model.revokeAllUserTokens(user.id);
};

/**
 * Send OTP for email verification (resend flow).
 */
const sendOtp = async (email, type = 'signup') => {
  const user = await model.findUserByEmail(email);
  if (!user) throw Object.assign(new Error('Email not found'), { status: 404 });

  const otp = generateOtp();
  await model.storeOtpToken(email, sha256(otp), type, minutesFromNow(OTP_EXPIRES_MINUTES));
  await sendOtpEmail(email, otp, type);
};

module.exports = {
  login,
  logout,
  refresh,
  signup,
  forgotPassword,
  verifyOtp,
  resetPassword,
  sendOtp,
};
