-- ============================================================
--  Migration 013 — Performance Reviews (HRM)
-- ============================================================

CREATE TABLE IF NOT EXISTS performance_reviews (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID         NOT NULL REFERENCES employees(id),
  reviewer_name   VARCHAR(150) NOT NULL,
  review_period   VARCHAR(80)  NOT NULL, -- Q1 2026, 2025 Annual, etc.
  rating          INTEGER      NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback        TEXT,
  status          VARCHAR(20)  NOT NULL DEFAULT 'Draft', -- Draft|Submitted|Acknowledged
  review_date     DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_perf_employee ON performance_reviews(employee_id) WHERE deleted_at IS NULL;
