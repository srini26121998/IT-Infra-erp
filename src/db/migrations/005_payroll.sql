-- ============================================================
--  Migration 005 — HRM Payroll
-- ============================================================

-- ── Salary Structures ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_structures (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  company_id      VARCHAR(20),
  components      JSONB        NOT NULL DEFAULT '{}',
  -- e.g. { "basic_pct": 50, "hra_pct": 20, "conveyance": 1600, "da_pct": 10 }
  is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Payroll Configurations ───────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll_configs (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          VARCHAR(20)  NOT NULL UNIQUE,
  pay_cycle           VARCHAR(20)  NOT NULL DEFAULT 'Monthly',
  calculation_basis   VARCHAR(20)  NOT NULL DEFAULT 'WorkingDays',
  pf_enabled          BOOLEAN      NOT NULL DEFAULT TRUE,
  pf_rate             NUMERIC(5,2)  DEFAULT 12,
  pf_employer_rate    NUMERIC(5,2)  DEFAULT 12,
  esi_enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
  esi_rate            NUMERIC(5,2)  DEFAULT 0.75,
  esi_employer_rate   NUMERIC(5,2)  DEFAULT 3.25,
  pt_enabled          BOOLEAN      NOT NULL DEFAULT TRUE,
  tds_enabled         BOOLEAN      NOT NULL DEFAULT FALSE,
  salary_components   JSONB        NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Employee Payroll Maps ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_payroll_maps (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id         UUID         NOT NULL UNIQUE REFERENCES employees(id),
  company_id          VARCHAR(20),
  pf_number           VARCHAR(30),
  esi_number          VARCHAR(30),
  bank_account        TEXT,                            -- AES-256 encrypted
  bank_name           VARCHAR(100),
  ifsc_code           VARCHAR(15),
  base_salary         NUMERIC(12,2) NOT NULL DEFAULT 0,
  component_overrides JSONB        NOT NULL DEFAULT '{}',
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Payroll Records ───────────────────────────────────────────
-- id pattern: PAY-EMP001-January-2026
CREATE TABLE IF NOT EXISTS payroll_records (
  id                VARCHAR(60)   PRIMARY KEY,
  employee_id       UUID          NOT NULL REFERENCES employees(id),
  company_id        VARCHAR(20),
  month             VARCHAR(20)   NOT NULL,
  year              INTEGER       NOT NULL,
  basic             NUMERIC(12,2) NOT NULL DEFAULT 0,
  hra               NUMERIC(12,2) NOT NULL DEFAULT 0,
  conveyance        NUMERIC(12,2) NOT NULL DEFAULT 0,
  da                NUMERIC(12,2) NOT NULL DEFAULT 0,
  medical           NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_allowances  NUMERIC(12,2) NOT NULL DEFAULT 0,
  gross_salary      NUMERIC(12,2) NOT NULL DEFAULT 0,
  lop_days          NUMERIC(5,2)  NOT NULL DEFAULT 0,
  lop_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  pf                NUMERIC(12,2) NOT NULL DEFAULT 0,
  esi               NUMERIC(12,2) NOT NULL DEFAULT 0,
  pt                NUMERIC(12,2) NOT NULL DEFAULT 0,
  tds               NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_deductions  NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_salary        NUMERIC(12,2) NOT NULL DEFAULT 0,
  attendance        JSONB         NOT NULL DEFAULT '{}',
  status            VARCHAR(15)   NOT NULL DEFAULT 'Draft',  -- Draft|Processed|Paid
  processed_date    DATE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_emp_month ON payroll_records(employee_id, year, month);

-- ── Timesheets ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timesheets (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID         NOT NULL REFERENCES employees(id),
  project_id    UUID,
  amc_id        UUID,
  work_date     DATE         NOT NULL,
  hours_worked  NUMERIC(4,2) NOT NULL,
  description   TEXT,
  status        VARCHAR(20)  NOT NULL DEFAULT 'Pending',
  approved_by   UUID         REFERENCES employees(id),
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timesheet_emp ON timesheets(employee_id, work_date);
