-- ============================================================
--  Migration 012 — Notifications, Settings, and Performance
-- ============================================================

-- ── Notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                 VARCHAR(20)    NOT NULL, -- email|project|security|escalation
  title                VARCHAR(250)   NOT NULL,
  message              TEXT           NOT NULL,
  is_read              BOOLEAN        NOT NULL DEFAULT FALSE,
  related_resource_type VARCHAR(60),
  related_resource_id   VARCHAR(100),
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notif_created     ON notifications(created_at DESC);

-- ── Email Service Logs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  type             VARCHAR(30)    NOT NULL, -- confirmation|invoice|expiry_warning|etc
  recipient_email  VARCHAR(255)   NOT NULL,
  subject          VARCHAR(300)   NOT NULL,
  body_html        TEXT,
  subscription_id  INTEGER        REFERENCES subscriptions(id),
  invoice_id       UUID           REFERENCES invoices(id),
  status           VARCHAR(15)    NOT NULL DEFAULT 'sent',
  provider_id      VARCHAR(100),  -- SendGrid/SES message ID
  error_message    TEXT,
  sent_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_type      ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_email     ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at   ON email_logs(sent_at DESC);

-- ── App Settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name         VARCHAR(200),
  logo_url             TEXT,
  currency             VARCHAR(5)     DEFAULT 'INR',
  timezone             VARCHAR(50)    DEFAULT 'Asia/Kolkata',
  date_format          VARCHAR(20)    DEFAULT 'DD/MM/YYYY',
  financial_year_start VARCHAR(20)    DEFAULT 'April',
  smtp_config          JSONB,
  approval_matrix      JSONB          DEFAULT '{}',
  escalation_rules     JSONB          DEFAULT '[]',
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── Performance Indexes ──────────────────────────────────────
-- Fast payroll lookup by company + period
CREATE INDEX IF NOT EXISTS idx_payroll_company_period ON payroll_records(company_id, year, month);

-- Fast contract lookup by client + status
CREATE INDEX IF NOT EXISTS idx_contracts_client_status ON contracts(client, status) WHERE deleted_at IS NULL;

-- Fast subscription expiry check (cron job)
CREATE INDEX IF NOT EXISTS idx_sub_expiry_check ON subscriptions(end_date, status) WHERE deleted_at IS NULL AND status != 'EXPIRED';

-- Fast attendance reporting by dept/period
CREATE INDEX IF NOT EXISTS idx_att_date_range ON attendance(date, employee_id);

-- Full text search on employee names and emails
CREATE INDEX IF NOT EXISTS idx_emp_fulltext ON employees USING gin(to_tsvector('english', name || ' ' || COALESCE(email,'')));
