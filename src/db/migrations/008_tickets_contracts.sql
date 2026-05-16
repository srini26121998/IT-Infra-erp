-- ============================================================
--  Migration 008 — Helpdesk Tickets & Contracts
-- ============================================================

-- ── Helpdesk Tickets ────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS ticket_seq START 1;

CREATE TABLE IF NOT EXISTS tickets (
  id                    VARCHAR(20)  PRIMARY KEY, -- TKT-XXXX
  subject               VARCHAR(250) NOT NULL,
  description           TEXT         NOT NULL,
  priority              VARCHAR(15)  NOT NULL, -- Low|Medium|High|Critical
  status                VARCHAR(20)  NOT NULL DEFAULT 'Pending',
  requester             VARCHAR(150),
  company_name          VARCHAR(150),
  mobile_number         VARCHAR(20),
  email_id              VARCHAR(255),
  assigned_employee_id  UUID         REFERENCES employees(id),
  deadline              TIMESTAMPTZ,
  acknowledged_at       TIMESTAMPTZ,
  submission_text       TEXT,
  submission_screenshot VARCHAR(500),
  manager_feedback      TEXT,
  response_sla_time     TIMESTAMPTZ  NOT NULL,
  resolution_sla_time   TIMESTAMPTZ  NOT NULL,
  sla_status            VARCHAR(20)  DEFAULT 'On Time',
  escalation_level      SMALLINT     NOT NULL DEFAULT 0, -- 0|1|2
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ticket_timeline (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  VARCHAR(20)  NOT NULL REFERENCES tickets(id),
  event      TEXT         NOT NULL,
  actor      VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_status   ON tickets(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_sla      ON tickets(escalation_level) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_timeline_ticket ON ticket_timeline(ticket_id);

-- ── Contract Management ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id                          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number             VARCHAR(30)    UNIQUE NOT NULL,
  contract_name               VARCHAR(250)   NOT NULL,
  contract_type               VARCHAR(20)    NOT NULL, -- Lump Sum|Unit Rate|etc
  client                      VARCHAR(150)   NOT NULL,
  contract_value              NUMERIC(15,2)  NOT NULL,
  contract_date               DATE           NOT NULL,
  start_date                  DATE           NOT NULL,
  end_date                    DATE           NOT NULL,
  project_manager             VARCHAR(150)   NOT NULL,
  payment_terms               VARCHAR(30)    NOT NULL DEFAULT '{}',
  retention_percentage        NUMERIC(5,2)   NOT NULL DEFAULT 0,
  mobilization_adv_percentage NUMERIC(5,2)   NOT NULL DEFAULT 0,
  escalation_clause           BOOLEAN        NOT NULL DEFAULT FALSE,
  penalty_clause              BOOLEAN        NOT NULL DEFAULT FALSE,
  location                    TEXT[]         NOT NULL DEFAULT '{}',
  status                      VARCHAR(20)    NOT NULL DEFAULT 'Pre-Award',
  created_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client);
