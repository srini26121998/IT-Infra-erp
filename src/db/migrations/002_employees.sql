-- ============================================================
--  Migration 002 — Departments, Designations, Branches
-- ============================================================

CREATE TABLE IF NOT EXISTS branches (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL,
  code        VARCHAR(20),
  address     TEXT,
  city        VARCHAR(100),
  state       VARCHAR(100),
  country     VARCHAR(100),
  status      status_basic NOT NULL DEFAULT 'Active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS departments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL,
  code        VARCHAR(20),
  branch_id   UUID REFERENCES branches(id),
  head_id     UUID,  -- references employees(id) added later
  status      status_basic NOT NULL DEFAULT 'Active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS designations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL,
  department_id UUID REFERENCES departments(id),
  status      status_basic NOT NULL DEFAULT 'Active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- ── Employees ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      VARCHAR(20) UNIQUE NOT NULL,  -- e.g. EMP-0001
  name             VARCHAR(150) NOT NULL,
  email            VARCHAR(255) UNIQUE NOT NULL,
  personal_email   VARCHAR(255),
  phone_number     VARCHAR(20) NOT NULL,
  role             VARCHAR(100) NOT NULL,         -- job title
  department_id    UUID REFERENCES departments(id),
  designation_id   UUID REFERENCES designations(id),
  join_date        DATE NOT NULL,
  relieving_date   DATE,
  status           VARCHAR(20) NOT NULL DEFAULT 'Active', -- Active|Inactive|On Leave
  aadhaar_number   TEXT,    -- AES-256 encrypted
  pan_number       VARCHAR(20),
  bank_name        VARCHAR(100),
  account_number   TEXT,    -- AES-256 encrypted
  ifsc_code        VARCHAR(15),
  gross_salary     NUMERIC(12,2) DEFAULT 0,
  net_salary       NUMERIC(12,2) DEFAULT 0,
  company_id       UUID,
  branch_id        UUID REFERENCES branches(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_emp_status   ON employees(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_emp_dept     ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_emp_name_trgm ON employees USING gin(name gin_trgm_ops);

-- ── Employee Documents ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_documents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  doc_type     VARCHAR(30) NOT NULL,  -- aadhaar|pan|certificate|address_proof
  file_name    VARCHAR(255) NOT NULL,
  file_url     TEXT        NOT NULL,  -- S3 / storage URL
  file_size    INTEGER,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
