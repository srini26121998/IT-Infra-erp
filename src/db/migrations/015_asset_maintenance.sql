-- ============================================================
--  Migration 015 — Asset Maintenance
-- ============================================================

CREATE TABLE IF NOT EXISTS asset_maintenance (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          UUID,           -- Optional reference to specific asset (employee_assets or company_assets)
  asset_name        VARCHAR(200)   NOT NULL,
  asset_tag         VARCHAR(50),
  service_type      VARCHAR(100)   NOT NULL, -- Repair|Hardware Upgrade|Firmware Update|Routine Check
  cost              NUMERIC(12,2)  DEFAULT 0,
  maintenance_date  DATE           NOT NULL DEFAULT CURRENT_DATE,
  description       TEXT,
  status            VARCHAR(20)    NOT NULL DEFAULT 'In Progress', -- Completed|In Progress|Overdue|Pending
  performed_by      VARCHAR(150),
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_asset_maint_status ON asset_maintenance(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_asset_maint_date   ON asset_maintenance(maintenance_date DESC);
