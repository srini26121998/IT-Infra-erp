-- Migration: 016_asset_audits.sql
-- Description: Table to track all lifecycle events of assets

CREATE TABLE IF NOT EXISTS asset_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES employee_assets(id) ON DELETE SET NULL,
    asset_tag VARCHAR(50),
    action VARCHAR(50) NOT NULL, -- CREATED, ALLOCATED, RETURNED, MAINTENANCE, DECOMMISSIONED, UPDATED
    custodian_name VARCHAR(255),
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_asset_audits_asset_id ON asset_audits(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_audits_asset_tag ON asset_audits(asset_tag);
