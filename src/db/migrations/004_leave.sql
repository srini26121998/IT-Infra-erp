-- ============================================================
--  Migration 004 — HRM Leave Management
-- ============================================================

CREATE TABLE IF NOT EXISTS leave_requests (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id        UUID         NOT NULL REFERENCES employees(id),
  type               VARCHAR(20)  NOT NULL,           -- Off-day | Full Day | Permission
  start_date         DATE         NOT NULL,
  end_date           DATE         NOT NULL,
  start_time         TIME,                            -- Permission type only
  end_time           TIME,                            -- Permission type only
  reason             TEXT         NOT NULL,
  backup_support_id  UUID         REFERENCES employees(id),
  status             VARCHAR(15)  NOT NULL DEFAULT 'Pending',  -- Pending | Approved | Rejected
  manager_id         UUID         REFERENCES employees(id),
  manager_comment    TEXT,
  applied_date       DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_emp    ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_dates  ON leave_requests(start_date, end_date);
