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
    name: user.name,
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
    name: user.name,
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
 * Signup — registration, sends OTP for verification.
 * Requires role parameter to be passed explicitly.
 */
const signup = async ({ name, email, username, password, companyId, role }) => {
  const existing = await model.findUserByEmail(email);
  if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await model.createUser({ name, email, username, passwordHash, role, companyId });

  // Send email verification OTP
  const otp = generateOtp();
  await model.storeOtpToken(email, sha256(otp), 'signup', minutesFromNow(OTP_EXPIRES_MINUTES));
  await sendOtpEmail(email, otp, 'signup');

  return { id: user.id, name: user.name, email: user.email, role: user.role };
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

/**
 * Check Role — fetch the user's role by email or username.
 */
const checkRole = async (identifier) => {
  const user = await model.findUserByEmailOrUsername(identifier);
  return { role: user ? user.role : null };
};

/**
 * Get Profile — return aggregated profile data for the current user based on role.
 */
const getProfile = async (userPayload) => {
  const user = await model.findUserById(userPayload.id);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const roleName = user.role === 'super-admin' ? 'Super Administrator' : 
                   user.role === 'admin' ? 'Administrator' : 
                   user.role === 'hr' ? 'HR Manager' : 
                   user.role === 'company' ? 'Company Profile' : 'Employee';

  return {
    personalInfo: [
      { label: 'Full Name', value: user.name || 'User' },
      { label: 'Father Name', value: 'Senior Admin' },
      { label: 'Date of Birth', value: '15 May 1990' },
      { label: 'Gender', value: 'Male' },
      { label: 'Blood Group', value: 'O+' },
      { label: 'Nationality', value: 'Indian' },
      { label: 'Marital Status', value: 'Married' },
      { label: 'Religion', value: 'Other' }
    ],
    jobDetails: [
      { label: 'Employee ID', value: user.employee_id || 'EMP-0001' },
      { label: 'Designation', value: roleName },
      { label: 'Department', value: 'Management' },
      { label: 'Join Date', value: '01 Jan 2022' },
      { label: 'Employment Type', value: 'Full Time' },
      { label: 'Current Status', value: 'Probation' },
      { label: 'Work Location', value: 'Mumbai HQ' },
      { label: 'Shift', value: 'Day (09:00 - 18:00)' }
    ],
    workExperience: [
      {
        role: roleName,
        company: 'IT Infra ERP',
        duration: 'Jan 2022 - Present',
        desc: 'Managing core infrastructure, user permissions, and system configurations.'
      },
      {
        role: 'Senior System Analyst',
        company: 'TechGlobal MNC',
        duration: 'Mar 2018 - Dec 2021',
        desc: 'Led backend optimization team and cloud architectures.'
      }
    ],
    skills: ['Infra Management', 'Angular', 'Tailwind CSS', 'Architecture', 'Security', 'Node.js', 'Cloud', 'SQL'],
    documents: [
      { name: 'ID_Proof.pdf', size: '1.2 MB', date: '10 Jan 2022' },
      { name: 'Degree.pdf', size: '2.5 MB', date: '05 Jan 2022' },
      { name: 'Exp_Letter.pdf', size: '800 KB', date: '12 Jan 2022' }
    ],
    performanceReviews: [
      {
        review_period: '2025 Annual Review',
        reviewer_name: 'Senior Management',
        rating: 5,
        feedback: 'Exceptional performance in maintaining IT infrastructure and deploying the new ERP system. Demonstrated great leadership.',
        status: 'Acknowledged',
        review_date: new Date('2025-12-15')
      },
      {
        review_period: 'Q2 2025',
        reviewer_name: 'Senior Management',
        rating: 4,
        feedback: 'Good work on the cloud migration project. Needs minor improvement in delegating tasks.',
        status: 'Submitted',
        review_date: new Date('2025-07-05')
      }
    ],
    metrics: {
      projects: { completed: 8, ongoing: 4 },
      tasks: { resolved: 38, pending: 7 },
      performanceIndex: 9.2
    }
  };
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
  checkRole,
  getProfile,
};
