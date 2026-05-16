-- ============================================================
--  More Sample Data for ERP System
--  Run against: erp_db / it_infra database
-- ============================================================

DO $$
DECLARE
  -- Reusing Employee UUIDs from previous sample data
  emp_john UUID := 'ad1a4736-ef0c-4252-a8fd-1b8ab5d359f7';
  emp_srini UUID := 'dc8d7e66-32af-4c42-8b56-31cc2857cfb7';
  emp_sree UUID := '2037e0ac-b188-40f9-9c5d-16c887c072a0';
  emp_sreeni UUID := 'a5e35d2e-3d8d-48f2-bc79-82a2b893e1cf';

BEGIN

-- ── 1. Project Registry (projects) ──────────────────────────
INSERT INTO projects (name, code, client, manager_id, start_date, end_date, status, budget, completion_percent, description)
VALUES 
  ('ERP Implementation', 'PRJ-ERP-01', 'Acme Corp', emp_john, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '120 days', 'Active', 150000.00, 45.00, 'End-to-end ERP implementation for Acme Corp'),
  ('Cloud Migration', 'PRJ-CM-02', 'Global Tech', emp_srini, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days', 'Active', 85000.00, 20.00, 'AWS Cloud Migration for legacy systems'),
  ('Security Audit', 'PRJ-SA-03', 'FinTech Solutions', emp_sree, CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '45 days', 'Planning', 40000.00, 0.00, 'Comprehensive security audit and penetration testing')
ON CONFLICT (code) DO NOTHING;

-- ── 2. Salary Structure (salary_structures) ──────────────────
INSERT INTO salary_structures (name, description, components, is_default)
VALUES 
  ('Executive Management - Grade S', 'Executive management salary structure', '[{"key": "basic", "label": "Basic", "type": "percentage", "value": 40}, {"key": "hra", "label": "HRA", "type": "percentage", "value": 20}, {"key": "special", "label": "Special Allowance", "type": "percentage", "value": 40}]'::jsonb, false),
  ('Trainee Engineer - Grade T', 'Trainee level engineering salary structure', '[{"key": "basic", "label": "Basic", "type": "percentage", "value": 60}, {"key": "hra", "label": "HRA", "type": "percentage", "value": 20}, {"key": "conveyance", "label": "Conveyance", "type": "fixed", "value": 1000}, {"key": "medical", "label": "Medical", "type": "fixed", "value": 1000}]'::jsonb, false)
-- Conflicts not defined on name, so keeping simple. We can assume these are added.
;

-- ── 3. Employee Asset (employee_assets) ──────────────────────
INSERT INTO employee_assets (tag, name, category, employee_id, distributed_on, status, notes)
VALUES 
  ('AST-LAP-001', 'MacBook Pro M3 16GB', 'Laptop', emp_john, CURRENT_DATE - INTERVAL '180 days', 'Active', 'Primary work laptop'),
  ('AST-MON-002', 'Dell UltraSharp 27"', 'Monitor', emp_john, CURRENT_DATE - INTERVAL '180 days', 'Active', 'Secondary display'),
  ('AST-LAP-003', 'ThinkPad T14 Gen 4', 'Laptop', emp_srini, CURRENT_DATE - INTERVAL '90 days', 'Active', 'Assigned for development'),
  ('AST-MOB-004', 'iPhone 15 Pro', 'Mobile', emp_sreeni, CURRENT_DATE - INTERVAL '30 days', 'Active', 'Company phone for sales calls')
ON CONFLICT (tag) DO NOTHING;

-- ── 4. Company Assets (company_assets) ───────────────────────
INSERT INTO company_assets (company_id, name, category, quantity, purchase_date, warranty_expiry, status)
VALUES 
  (NULL, 'Cisco Meraki Switch 24-Port', 'Networking', 2, CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE + INTERVAL '365 days', 'Active'),
  (NULL, 'Logitech MeetUp Conference Cam', 'Hardware', 1, CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE + INTERVAL '610 days', 'Active'),
  (NULL, 'Server Rack 42U', 'Infrastructure', 1, CURRENT_DATE - INTERVAL '700 days', CURRENT_DATE - INTERVAL '300 days', 'Active');

-- ── 5. Subscriptions (subscriptions) ──────────────────────────
INSERT INTO subscriptions (name, provider, plan, payment_type, customer_name, customer_email, start_date, end_date, duration_years, auto_renew, monthly_cost, total_cost, status, renewal_status)
VALUES 
  ('AWS Hosting - Prod', 'Amazon Web Services', 'Enterprise Support', 'Subscription', 'Internal IT', 'it@infraerp.com', CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE + INTERVAL '185 days', 1, true, 2500.00, 30000.00, 'ACTIVE', 'PENDING'),
  ('Google Workspace', 'Google', 'Business Plus', 'Subscription', 'Internal HR', 'hr@infraerp.com', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '355 days', 1, true, 500.00, 6000.00, 'ACTIVE', 'PENDING'),
  ('JetBrains All Products Pack', 'JetBrains', 'Commercial Annual', 'Subscription', 'Engineering', 'eng@infraerp.com', CURRENT_DATE - INTERVAL '300 days', CURRENT_DATE + INTERVAL '65 days', 1, false, 800.00, 9600.00, 'ACTIVE', 'PENDING');

-- ── 6. Helpdesk (tickets) ────────────────────────────────────
INSERT INTO tickets (id, subject, description, priority, status, requester, email_id, assigned_employee_id, response_sla_time, resolution_sla_time, escalation_level)
VALUES 
  ('TKT-2026-001', 'VPN Access Issue', 'Unable to connect to production VPN from home network', 'High', 'Pending', 'Alex Smith', 'alex.smith@infraerp.com', emp_srini, NOW() + INTERVAL '2 hours', NOW() + INTERVAL '8 hours', 0),
  ('TKT-2026-002', 'Request for new IDE License', 'Need IntelliJ IDEA license for new microservices project', 'Medium', 'Open', 'Sara Connor', 'sara.connor@infraerp.com', emp_john, NOW() + INTERVAL '4 hours', NOW() + INTERVAL '24 hours', 0),
  ('TKT-2026-003', 'Office WiFi extremely slow', 'Experiencing high latency on the guest network in the conference room', 'Medium', 'Resolved', 'David Palmer', 'david.palmer@infraerp.com', emp_sree, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 0)
ON CONFLICT (id) DO NOTHING;

END $$;
