-- ============================================================
--  Migration 021 - Add assignee type and company to tickets
-- ============================================================

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS assignee_type VARCHAR(20) DEFAULT 'employee',
ADD COLUMN IF NOT EXISTS assigned_company_id UUID REFERENCES companies(id);

CREATE INDEX IF NOT EXISTS idx_tickets_assigned_company ON tickets(assigned_company_id);
