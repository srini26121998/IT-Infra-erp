'use strict';
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// ── Route imports ──────────────────────────────────────────
const authRoutes = require('./modules/auth/auth.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const employeesRoutes = require('./modules/employees/employees.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const leaveRoutes = require('./modules/leave/leave.routes');
const payrollRoutes = require('./modules/payroll/payroll.routes');
const salaryStructureRoutes = require('./modules/payroll/salary-structures.routes');
const timesheetRoutes = require('./modules/payroll/timesheet.routes');
const organizationRoutes = require('./modules/organization/organization.routes');
const jobsRoutes = require('./modules/jobs/jobs.routes');
const projectsRoutes = require('./modules/projects/projects.routes');
const assetsRoutes = require('./modules/assets/assets.routes');
const subscriptionsRoutes = require('./modules/subscriptions/subscriptions.routes');
const ticketsRoutes = require('./modules/tickets/tickets.routes');
const contractsRoutes = require('./modules/contracts/contracts.routes');
const revenueRoutes = require('./modules/revenue/revenue.routes');
const amcRoutes = require('./modules/amc/amc.routes');
const companiesRoutes = require('./modules/companies/companies.routes');
const branchesRoutes = require('./modules/branches/branches.routes');
const invoicesRoutes = require('./modules/invoices/invoices.routes');
const rolesRoutes = require('./modules/roles/roles.routes');
const workflowRoutes = require('./modules/workflow/workflow.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const settingsRoutes = require('./modules/settings/settings.routes');
const trackingRoutes = require('./modules/tracking/tracking.routes');
const navigationRoutes = require('./modules/navigation/navigation.routes');

const app = express();

// ── CORS — must be the VERY FIRST middleware ──────────────
//
// Strategy:
//  1. Manually set Access-Control-* headers on every response
//     so CORS headers are present even when later middleware
//     throws an error (e.g. 401 from auth middleware).
//  2. Immediately respond 204 to OPTIONS preflight requests
//     BEFORE they reach auth middleware (which would 401 them).
//  3. The `cors` package is kept as a secondary measure.

const CORS_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'Cache-Control',
  'Pragma',
].join(', ');

// Step 1 — inject CORS headers on every request/response
app.use((req, res, next) => {
  const origin = req.headers['origin'];

  const isAllowedOrigin =
    !origin ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(o => o.trim())
      .includes(origin);

  if (isAllowedOrigin && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', CORS_ALLOWED_HEADERS);
  res.setHeader('Access-Control-Max-Age', '86400');

  // Step 2 — short-circuit OPTIONS preflight immediately
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// ── Security headers (after CORS so it doesn't strip them) ─
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
}));

// ── Body parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP request logger ────────────────────────────────────
app.use((req, _res, next) => {
  logger.http(`${req.method} ${req.originalUrl}`);
  next();
});

// ── Rate limiting ──────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 60_000,      // 1 minute
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/v1/auth', authLimiter);

// ── Health check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── API v1 routes ──────────────────────────────────────────
app.use('/v1/auth', authRoutes);
app.use('/v1/dashboard', dashboardRoutes);
app.use('/v1/employees', employeesRoutes);
app.use('/v1/attendance', attendanceRoutes);
app.use('/v1/leave', leaveRoutes);
app.use('/v1/salary-structures', salaryStructureRoutes);
app.use('/v1/payroll/timesheets', timesheetRoutes);
app.use('/v1/payroll', payrollRoutes);
app.use('/v1/org', organizationRoutes);
app.use('/v1/jobs', jobsRoutes);
app.use('/v1/projects', projectsRoutes);
app.use('/v1/assets', assetsRoutes);
app.use('/v1/subscriptions', subscriptionsRoutes);
app.use('/v1/tickets', ticketsRoutes);
app.use('/v1/contracts', contractsRoutes);
app.use('/v1/revenue', revenueRoutes);
app.use('/v1/amc', amcRoutes);
app.use('/v1/companies', companiesRoutes);
app.use('/v1/branches', branchesRoutes);
app.use('/v1/invoices', invoicesRoutes);
app.use('/v1/roles', rolesRoutes);
app.use('/v1/workflows', workflowRoutes);
app.use('/v1/workflow', workflowRoutes);
app.use('/v1/reports', reportsRoutes);
app.use('/v1/audit', auditRoutes);
app.use('/v1/notifications', notificationsRoutes);
app.use('/v1/settings', settingsRoutes);
app.use('/v1/tracking', trackingRoutes);
app.use('/v1/navigation', navigationRoutes);

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ───────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  logger.error(`${err.message}\n${err.stack}`);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = { app };
