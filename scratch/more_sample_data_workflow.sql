-- ============================================================
--  More Sample Data for ERP System (Timesheets, Companies, Branches, Escalations, Audit)
--  Run against: erp_db / it_infra database
-- ============================================================

DO $$
DECLARE
  emp_john UUID := 'ad1a4736-ef0c-4252-a8fd-1b8ab5d359f7';
  emp_srini UUID := 'dc8d7e66-32af-4c42-8b56-31cc2857cfb7';
  emp_sree UUID := '2037e0ac-b188-40f9-9c5d-16c887c072a0';
  
  comp_1 UUID := gen_random_uuid();
  comp_2 UUID := gen_random_uuid();
  
  branch_1 UUID := gen_random_uuid();
  branch_2 UUID := gen_random_uuid();

  admin_user UUID := 'fa3282c9-66ff-4ed9-943f-8b9d262c344f'; -- Super Admin
  
BEGIN

-- ── 1. Timesheets (timesheets) ────────────────────────────────
-- More timesheet records for May 2026
INSERT INTO timesheets (employee_id, work_date, hours_worked, description, status, approved_by, approved_at)
VALUES 
  (emp_john, CURRENT_DATE - INTERVAL '3 days', 8.50, 'ERP Installation Configuration', 'Approved', emp_sree, CURRENT_DATE - INTERVAL '2 days'),
  (emp_john, CURRENT_DATE - INTERVAL '4 days', 7.00, 'Client meeting and requirement gathering', 'Pending', NULL, NULL),
  (emp_srini, CURRENT_DATE - INTERVAL '3 days', 9.00, 'Frontend Development for Dashboard', 'Approved', emp_sree, CURRENT_DATE - INTERVAL '2 days'),
  (emp_sree, CURRENT_DATE - INTERVAL '3 days', 8.00, 'Code Review and Deployment', 'Pending', NULL, NULL);

-- ── 2. Companies (companies) ──────────────────────────────────
INSERT INTO companies (id, code, name, industry, head, email, phone, location, address, subscription_plan, billing_cycle)
VALUES 
  (comp_1, 'COMP-2026-001', 'Acme Corporation', 'Manufacturing', 'Robert Williams', 'contact@acme.corp', '+1-800-555-0199', 'New York', '100 Broadway, NY', 'Enterprise', 'Annual'),
  (comp_2, 'COMP-2026-002', 'Tech Global', 'IT Services', 'Sarah Jenkins', 'info@techglobal.net', '+44-20-7946-0958', 'London', 'Tech Hub, City Road', 'Platinum', 'Monthly')
ON CONFLICT (code) DO NOTHING;

-- ── 3. Branches (branches) ────────────────────────────────────
-- Note: Branches reference the newly created companies
INSERT INTO branches (id, company_id, name, code, location, address, phone, email, manager)
VALUES 
  (branch_1, comp_1, 'Acme NY East', 'BR-ACME-001', 'New York East', '150 East 42nd St', '+1-800-555-1000', 'ny.east@acme.corp', 'John Smith'),
  (branch_2, comp_2, 'Tech Global London HQ', 'BR-TECH-001', 'London City', '200 City Road, London', '+44-20-7946-1000', 'hq@techglobal.net', 'Jane Doe')
ON CONFLICT (code) DO NOTHING;

-- ── 4. Escalations / SLA Config (sla_config) ──────────────────
-- We update the escalation matrix. Since "Critical", "High", "Medium", "Low" exist, we add "Urgent" as an escalation tier.
INSERT INTO sla_config (priority, response_hours, resolution_hours)
VALUES 
  ('Urgent', 1, 2),
  ('VIP', 2, 4)
ON CONFLICT (priority) DO NOTHING;

-- ── 5. Audit Logs (audit_logs) ────────────────────────────────
-- Insert partitioned audit logs for the current month
INSERT INTO audit_logs (id, user_id, user_name, user_role, action, resource_type, resource_id, changes, ip_address, user_agent, created_at)
VALUES 
  (gen_random_uuid(), admin_user, 'Super Admin', 'super-admin', 'CREATE', 'contract', 'CON-2026-001', '{"status": "Active", "client": "Metro Authority"}'::jsonb, '192.168.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', CURRENT_DATE - INTERVAL '1 day'),
  (gen_random_uuid(), admin_user, 'Super Admin', 'super-admin', 'UPDATE', 'employee', emp_srini::text, '{"gross_salary": {"old": 60000, "new": 65000}}'::jsonb, '192.168.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', CURRENT_DATE - INTERVAL '5 hours'),
  (gen_random_uuid(), admin_user, 'Super Admin', 'super-admin', 'LOGIN', 'session', 'sess_12345', '{}'::jsonb, '192.168.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', CURRENT_DATE - INTERVAL '1 hour');

END $$;
