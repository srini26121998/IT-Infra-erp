-- ============================================================
--  Migration 022 - Fix assigned company foreign key constraint
-- ============================================================

-- If any employee IDs were mistakenly saved as company IDs due to assigneeType mapping:
UPDATE tickets 
SET assigned_employee_id = assigned_company_id, 
    assigned_company_id = NULL 
WHERE assignee_type = 'company' AND assigned_company_id IS NOT NULL;

-- Optional: Drop the foreign key constraint if you need to allow 'users.id' 
-- instead of 'companies.id' for external contractors:
-- ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_assigned_company_id_fkey;
