-- ============================================================
--  Migration 009 — Revenue, AMC, and Companies
-- ============================================================

-- ── Revenue Management (RA Billing) ─────────────────────────
CREATE TABLE IF NOT EXISTS ra_bills (
  id                          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number                 VARCHAR(30)    UNIQUE NOT NULL,
  contract_id                 UUID           NOT NULL REFERENCES contracts(id),
  bill_period                 VARCHAR(60)    NOT NULL,
  bill_date                   DATE           NOT NULL,
  work_completion_percentage  NUMERIC(5,2)   NOT NULL,
  gross_amount                NUMERIC(15,2)  NOT NULL,
  previous_bills_amount       NUMERIC(15,2)  NOT NULL DEFAULT 0,
  advance_deduction           NUMERIC(15,2)  NOT NULL DEFAULT 0,
  retention_amount            NUMERIC(15,2)  NOT NULL DEFAULT 0,
  net_bill_amount             NUMERIC(15,2)  GENERATED ALWAYS AS (gross_amount - previous_bills_amount - advance_deduction - retention_amount) STORED,
  gst_percentage              NUMERIC(5,2)   NOT NULL DEFAULT 18,
  cgst_amount                 NUMERIC(15,2)  NOT NULL DEFAULT 0,
  sgst_amount                 NUMERIC(15,2)  NOT NULL DEFAULT 0,
  tds_percentage              NUMERIC(5,2)   NOT NULL DEFAULT 0,
  tds_amount                  NUMERIC(15,2)  NOT NULL DEFAULT 0,
  total_invoice_value         NUMERIC(15,2)  NOT NULL DEFAULT 0,
  status                      VARCHAR(20)    NOT NULL DEFAULT 'Draft', -- Draft|Submitted|Approved|Authorized|Paid
  created_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ
);

-- ── AMC Management ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amc_contracts (
  id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  amc_number            VARCHAR(30)    UNIQUE NOT NULL,
  amc_name              VARCHAR(250)   NOT NULL,
  customer              VARCHAR(150)   NOT NULL,
  amc_type              VARCHAR(25)    NOT NULL, -- Comprehensive|Non-Comprehensive
  number_of_units       INTEGER        NOT NULL DEFAULT 1,
  start_date            DATE           NOT NULL,
  end_date              DATE           NOT NULL,
  total_amc_value       NUMERIC(15,2)  NOT NULL,
  payment_frequency     VARCHAR(25)    NOT NULL, -- Monthly|Quarterly|Advance|Annually
  response_time_sla     INTEGER        NOT NULL, -- hours
  resolution_time_sla   INTEGER        NOT NULL, -- hours
  penalty_per_hour      NUMERIC(12,2)  NOT NULL DEFAULT 0,
  auto_renewal          BOOLEAN        NOT NULL DEFAULT FALSE,
  status                VARCHAR(25)    NOT NULL DEFAULT 'Active',
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS amc_service_tickets (
  id                          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number               VARCHAR(30)    UNIQUE NOT NULL,
  amc_id                      UUID           NOT NULL REFERENCES amc_contracts(id),
  call_date_time              TIMESTAMPTZ    NOT NULL,
  call_type                   VARCHAR(20)    NOT NULL, -- Breakdown|Preventive|Inspection
  equipment_unit              VARCHAR(150)   NOT NULL,
  reported_by                 VARCHAR(150)   NOT NULL,
  contact_number              VARCHAR(20)    NOT NULL,
  problem_description         TEXT           NOT NULL,
  priority                    VARCHAR(15)    NOT NULL,
  assigned_to                 VARCHAR(150),
  response_due_by             TIMESTAMPTZ    NOT NULL,
  resolution_due_by           TIMESTAMPTZ    NOT NULL,
  response_actual_datetime    TIMESTAMPTZ,
  resolution_actual_datetime  TIMESTAMPTZ,
  status                      VARCHAR(20)    NOT NULL DEFAULT 'Open', -- Open|Assigned|In Progress|Resolved|Closed
  penalty_hours               NUMERIC(8,2)   GENERATED ALWAYS AS (GREATEST(0, EXTRACT(EPOCH FROM (resolution_actual_datetime - resolution_due_by))/3600)) STORED,
  created_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amc_status       ON amc_contracts(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_amct_amc         ON amc_service_tickets(amc_id);
CREATE INDEX IF NOT EXISTS idx_amct_status      ON amc_service_tickets(status);

-- ── Organizational — Companies ──────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  code              VARCHAR(20)    UNIQUE NOT NULL, -- COMP-0001
  name              VARCHAR(200)   NOT NULL,
  industry          VARCHAR(100)   NOT NULL,
  head              VARCHAR(150),
  email             VARCHAR(255)   NOT NULL,
  phone             VARCHAR(20)    NOT NULL,
  location          VARCHAR(150)   NOT NULL,
  address           TEXT,
  coordinates       VARCHAR(50),   -- "lat, lng"
  subscription_plan VARCHAR(80),
  billing_cycle     VARCHAR(20),
  activation_date   DATE,
  renewal_date      DATE,
  monthly_cost      NUMERIC(12,2),
  annual_cost       NUMERIC(12,2),
  total_spent       NUMERIC(12,2)  DEFAULT 0,
  status            VARCHAR(20)    NOT NULL DEFAULT 'Active',
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_name   ON companies USING gin(name gin_trgm_ops);
