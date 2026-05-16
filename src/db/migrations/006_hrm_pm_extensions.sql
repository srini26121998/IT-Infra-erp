-- ============================================================
--  Migration 006 — HRM Extensions & Job Openings
-- ============================================================

-- Extend departments
ALTER TABLE departments ADD COLUMN IF NOT EXISTS head_employee_id UUID REFERENCES employees(id);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS parent_department_id UUID REFERENCES departments(id);
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'departments_code_unique') THEN
    ALTER TABLE departments ADD CONSTRAINT departments_code_unique UNIQUE (code);
  END IF;
END $$;

-- Extend designations
ALTER TABLE designations ADD COLUMN IF NOT EXISTS grade VARCHAR(20);

-- ── Job Openings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_openings (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(150) NOT NULL,
  department_id   UUID         REFERENCES departments(id),
  designation_id  UUID         REFERENCES designations(id),
  openings        INTEGER      NOT NULL DEFAULT 1,
  job_type        VARCHAR(20)  NOT NULL, -- Full-time|Part-time|Contract|Internship
  location        VARCHAR(150),
  description     TEXT,
  requirements    TEXT,
  salary_range    VARCHAR(50),
  deadline        DATE,
  status          VARCHAR(20)  NOT NULL DEFAULT 'Open', -- Open|Closed|On Hold
  created_by      UUID         REFERENCES users(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- ============================================================
--  Migration 007 — Project Management
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(200)   NOT NULL,
  code                VARCHAR(30)    UNIQUE,
  client              VARCHAR(150),
  manager_id          UUID           REFERENCES employees(id),
  start_date          DATE           NOT NULL,
  end_date            DATE,
  status              VARCHAR(20)    NOT NULL DEFAULT 'Planning', -- Planning|Active|On Hold|Completed|Cancelled
  budget              NUMERIC(15,2),
  completion_percent  NUMERIC(5,2)   DEFAULT 0,
  description         TEXT,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS project_team (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id  UUID         NOT NULL REFERENCES employees(id),
  role         VARCHAR(100),
  joined_at    DATE         NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (project_id, employee_id)
);
