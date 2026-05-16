require('dotenv').config();
console.log('>>> IT INFRA ERP BACKEND STARTING - VERSION 1.0.5 <<<');

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

const cors = require('cors');

const CORS_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'Cache-Control',
  'Pragma',
].join(', ');

// ── CORS Configuration ─────────────────────────────────────
const allowedOrigins = [
  'https://it-infr-erp-backend-develop.vercel.app',
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim())
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      // In development/testing, you might want to log this
      logger.warn(`CORS blocked for origin: ${origin}`);
      return callback(null, true); // Temporarily allow all to fix the immediate issue
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: CORS_ALLOWED_HEADERS
}));

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

// ── Root route ─────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'IT Infra ERP API is running',
    version: '1.0.5',
    docs: '/v1/docs (coming soon)',
    health: '/health'
  });
});

// ── Health check ───────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    const { query } = require('./db/pool');
    await query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      ts: new Date().toISOString(),
      env: process.env.NODE_ENV
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: err.message,
      ts: new Date().toISOString()
    });
  }
});

// ── Temporary Seed Route (Delete after use!) ────────────────
app.get('/v1/auth/seed-db', async (_req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const { query } = require('./db/pool');
    
    const email = 'superadmin@infraerp.com';
    const password = 'Admin@1234';
    const hash = await bcrypt.hash(password, 12);

    await query(`
      INSERT INTO users (name, email, username, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Super Admin', email, 'superadmin', hash, 'super-admin']);

    res.json({ success: true, message: 'Database seeded successfully with superadmin@infraerp.com' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Seed failed', error: err.message });
  }
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

// ── Temporary Migration Route (Delete after use!) ──────────
app.get('/v1/auth/migrate-db', async (_req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { query, pool } = require('./db/pool');
    const MIGRATIONS_DIR = path.join(__dirname, 'db', 'migrations');

    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
    const results = [];

    await query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const file of files) {
      const { rows } = await query('SELECT 1 FROM _migrations WHERE filename = $1', [file]);
      if (rows.length) {
        results.push({ file, status: 'skipped' });
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await query(sql);
      await query('INSERT INTO _migrations(filename) VALUES($1)', [file]);
      results.push({ file, status: 'applied' });
    }

    res.json({ success: true, message: 'Migrations completed', details: results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Migration failed', error: err.message });
  }
});

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

module.exports = app;
