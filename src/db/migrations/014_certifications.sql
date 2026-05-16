-- ============================================================
--  Migration 014 — Employee Certifications (HRM)
-- ============================================================

CREATE TABLE IF NOT EXISTS employee_certifications (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID         NOT NULL REFERENCES employees(id),
  name            VARCHAR(255) NOT NULL,
  authority       VARCHAR(255) NOT NULL,
  issued_date     DATE         NOT NULL,
  expiry_date     DATE,
  status          VARCHAR(20)  NOT NULL DEFAULT 'Active', -- Active|Expired
  certificate_url TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cert_employee ON employee_certifications(employee_id) WHERE deleted_at IS NULL;
