-- ============================================================
--  Migration 007 — IT Infrastructure (Assets & Subscriptions)
-- ============================================================

-- ── Assets ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_assets (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tag             VARCHAR(50)  UNIQUE NOT NULL,
  name            VARCHAR(150) NOT NULL,
  category        VARCHAR(80)  NOT NULL,
  employee_id     UUID         NOT NULL REFERENCES employees(id),
  distributed_on  DATE         NOT NULL,
  returned_on     DATE,
  status          VARCHAR(20)  NOT NULL DEFAULT 'Active', -- Active|Returned|Damaged|Lost
  notes           TEXT,
  processor       VARCHAR(100),
  memory          VARCHAR(100),
  storage         VARCHAR(100),
  network         VARCHAR(50),
  encryption      VARCHAR(50),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS asset_allocations_history (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID         NOT NULL REFERENCES employee_assets(id),
  employee_id     UUID         NOT NULL REFERENCES employees(id),
  action          VARCHAR(50)  NOT NULL, -- Assigned, Returned, Maintenance, Status_Change
  notes           TEXT,
  action_date     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_assets (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID,           -- Optional multi-tenant ref
  name              VARCHAR(150)   NOT NULL,
  category          VARCHAR(80)    NOT NULL,
  quantity          INTEGER        NOT NULL DEFAULT 1,
  purchase_date     DATE           NOT NULL,
  warranty_expiry   DATE,
  subscription_plan VARCHAR(80),
  billing_cycle     VARCHAR(20),    -- Monthly|Annual
  monthly_cost      NUMERIC(12,2)  DEFAULT 0,
  annual_cost       NUMERIC(12,2)  DEFAULT 0,
  total_spent       NUMERIC(12,2)  DEFAULT 0,
  activation_date   DATE,
  renewal_date      DATE,
  status            VARCHAR(20)    NOT NULL DEFAULT 'Active',
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_emp_assets_emp ON employee_assets(employee_id) WHERE deleted_at IS NULL;

-- ── Subscriptions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(80)    NOT NULL UNIQUE, -- Silver|Gold|Platinum|Enterprise
  price_monthly  NUMERIC(10,2)  NOT NULL,
  features       JSONB          DEFAULT '[]',
  is_active      BOOLEAN        NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                  SERIAL         PRIMARY KEY,
  name                VARCHAR(150)   NOT NULL,
  provider            VARCHAR(100)   NOT NULL,
  plan                VARCHAR(80)    NOT NULL,
  payment_type        VARCHAR(20)    NOT NULL, -- Subscription|Asset Purchase
  customer_name       VARCHAR(150)   NOT NULL,
  customer_email      VARCHAR(255)   NOT NULL,
  customer_phone      VARCHAR(20),
  start_date          DATE           NOT NULL,
  end_date            DATE           NOT NULL,
  duration_years      INTEGER        NOT NULL DEFAULT 1,
  auto_renew          BOOLEAN        NOT NULL DEFAULT FALSE,
  monthly_cost        NUMERIC(12,2)  NOT NULL,
  total_cost          NUMERIC(12,2)  NOT NULL,
  status              VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE', -- ACTIVE|EXPIRING_SOON|EXPIRED
  renewal_status      VARCHAR(20)    NOT NULL DEFAULT 'PENDING', -- PENDING|RENEWED
  maintenance_period  INTEGER,       -- Asset Purchase only
  asset_description   TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS subscription_transactions (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id   INTEGER        NOT NULL REFERENCES subscriptions(id),
  transaction_id    VARCHAR(60)    UNIQUE NOT NULL,
  order_id          VARCHAR(60)    UNIQUE NOT NULL,
  amount            NUMERIC(12,2)  NOT NULL,
  status            VARCHAR(20)    NOT NULL, -- SUCCESS|FAILED|PENDING
  gateway_response  JSONB,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_status   ON subscriptions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sub_end_date ON subscriptions(end_date) WHERE deleted_at IS NULL;
