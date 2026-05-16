-- ============================================================
--  Migration 011 — Workflow, Reports, and Partitioned Audit
-- ============================================================

-- ── Admin — Workflow System ──────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_config (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  priority          VARCHAR(15)    NOT NULL UNIQUE,
  response_hours    INTEGER        NOT NULL,
  resolution_hours  INTEGER        NOT NULL,
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

INSERT INTO sla_config (priority, response_hours, resolution_hours) VALUES 
('Critical', 1, 4),
('High',     4, 12),
('Medium',   8, 24),
('Low',      24, 72)
ON CONFLICT (priority) DO NOTHING;

CREATE TABLE IF NOT EXISTS workflow_requests (
  id                 UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  subject            VARCHAR(250)   NOT NULL,
  description        TEXT           NOT NULL,
  priority           VARCHAR(15)    NOT NULL DEFAULT 'Medium',
  requester_id       UUID           NOT NULL REFERENCES users(id),
  company_id         UUID           REFERENCES companies(id),
  assigned_to        UUID           REFERENCES employees(id),
  status             VARCHAR(20)    NOT NULL DEFAULT 'Pending', -- Pending|Assigned|In Progress|Under Review|Approved|Rejected
  submission_text    TEXT,
  submission_files   JSONB          DEFAULT '[]',
  reviewer_feedback  TEXT,
  deadline           TIMESTAMPTZ,
  response_sla       TIMESTAMPTZ,
  resolution_sla     TIMESTAMPTZ,
  sla_breached       BOOLEAN        NOT NULL DEFAULT FALSE,
  timeline           JSONB          DEFAULT '[]',
  created_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── Admin — Audit Logs (Partitioned) ──────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID           NOT NULL,
  user_id         UUID           REFERENCES users(id) ON DELETE SET NULL,
  user_name       VARCHAR(150)   NOT NULL,
  user_role       VARCHAR(30)    NOT NULL,
  action          VARCHAR(30)    NOT NULL, -- CREATE|UPDATE|DELETE|LOGIN|APPROVE|etc
  resource_type   VARCHAR(60)    NOT NULL, -- e.g. "employee", "contract"
  resource_id     VARCHAR(100),
  changes         JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Monthly partitions for 2026
CREATE TABLE IF NOT EXISTS audit_logs_2026_01 PARTITION OF audit_logs FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE IF NOT EXISTS audit_logs_2026_02 PARTITION OF audit_logs FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE IF NOT EXISTS audit_logs_2026_03 PARTITION OF audit_logs FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS audit_logs_2026_04 PARTITION OF audit_logs FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS audit_logs_2026_05 PARTITION OF audit_logs FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX IF NOT EXISTS idx_audit_user     ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action   ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_ts       ON audit_logs(created_at DESC);
