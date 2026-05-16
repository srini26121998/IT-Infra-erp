-- ============================================================
--  Payroll Sample Data — IT Infra ERP
--  Run against: it_infra database (port 5000)
--  Employees already in DB:
--    EMP-0001 → ad1a4736-ef0c-4252-a8fd-1b8ab5d359f7  John Doe Updated
--    EMP-0002 → dc8d7e66-32af-4c42-8b56-31cc2857cfb7  Srini
--    EMP-0003 → 2037e0ac-b188-40f9-9c5d-16c887c072a0  Sree Man
--    EMP-0004 → a5e35d2e-3d8d-48f2-bc79-82a2b893e1cf  Sreenivasan
-- ============================================================

-- ── 1. Payroll Configurations (payroll_configs) ───────────────
-- One config per company. The UI uses company_id = 'COMP-0001'

INSERT INTO payroll_configs (
  company_id, pay_cycle, calculation_basis,
  pf_enabled, pf_rate, pf_employer_rate,
  esi_enabled, esi_rate, esi_employer_rate,
  pt_enabled, tds_enabled,
  salary_components
) VALUES (
  'COMP-0001', 'Monthly', 'WorkingDays',
  TRUE, 12.00, 12.00,
  TRUE, 0.75, 3.25,
  TRUE, FALSE,
  '[
    {"key":"basic",      "label":"Basic Salary",    "type":"percentage", "value":50},
    {"key":"hra",        "label":"HRA",              "type":"percentage", "value":20},
    {"key":"da",         "label":"DA",               "type":"percentage", "value":10},
    {"key":"conveyance", "label":"Conveyance",       "type":"fixed",      "value":1600},
    {"key":"medical",    "label":"Medical",          "type":"fixed",      "value":1250},
    {"key":"special",    "label":"Special Allowance","type":"percentage", "value":10}
  ]'::jsonb
)
ON CONFLICT (company_id) DO NOTHING;


-- ── 2. Salary Structures (salary_structures) ──────────────────
-- Grade-based structures: Junior, Mid, Senior

INSERT INTO salary_structures (id, name, description, components, is_default) VALUES
(
  gen_random_uuid(),
  'Junior Engineer — Grade A',
  'Entry level engineering salary structure',
  '[{"key": "basic", "label": "Basic", "type": "percentage", "value": 50}, {"key": "hra", "label": "HRA", "type": "percentage", "value": 20}]'::jsonb,
  FALSE
),
(
  gen_random_uuid(),
  'Mid-Level Engineer — Grade B',
  'Mid level engineering salary structure',
  '[{"key": "basic", "label": "Basic", "type": "percentage", "value": 50}, {"key": "hra", "label": "HRA", "type": "percentage", "value": 20}, {"key": "special", "label": "Special Allowance", "type": "percentage", "value": 10}]'::jsonb,
  TRUE
),
(
  gen_random_uuid(),
  'Senior Engineer — Grade C',
  'Senior level engineering salary structure',
  '[{"key": "basic", "label": "Basic", "type": "percentage", "value": 50}, {"key": "hra", "label": "HRA", "type": "percentage", "value": 20}, {"key": "special", "label": "Special Allowance", "type": "percentage", "value": 15}]'::jsonb,
  FALSE
);


-- ── 3. Employee Payroll Maps (employee_payroll_maps) ──────────
-- Maps each employee to bank details + base salary

INSERT INTO employee_payroll_maps (
  employee_id, company_id,
  pf_number, esi_number,
  bank_account, bank_name, ifsc_code,
  base_salary, component_overrides
) VALUES
-- EMP-0001  John Doe Updated
(
  'ad1a4736-ef0c-4252-a8fd-1b8ab5d359f7', 'COMP-0001',
  'PF/TN/1234/0001', 'ESI/TN/0001',
  '1234567890123456', 'HDFC Bank', 'HDFC0001234',
  75000.00,
  '{"medical": 1500}'::jsonb
),
-- EMP-0002  Srini
(
  'dc8d7e66-32af-4c42-8b56-31cc2857cfb7', 'COMP-0001',
  'PF/TN/1234/0002', 'ESI/TN/0002',
  '2345678901234567', 'SBI', 'SBIN0001234',
  60000.00,
  '{}'::jsonb
),
-- EMP-0003  Sree Man
(
  '2037e0ac-b188-40f9-9c5d-16c887c072a0', 'COMP-0001',
  'PF/TN/1234/0003', 'ESI/TN/0003',
  '3456789012345678', 'ICICI Bank', 'ICIC0001234',
  80000.00,
  '{"conveyance": 2500}'::jsonb
),
-- EMP-0004  Sreenivasan
(
  'a5e35d2e-3d8d-48f2-bc79-82a2b893e1cf', 'COMP-0001',
  'PF/TN/1234/0004', 'ESI/TN/0004',
  '4567890123456789', 'Axis Bank', 'UTIB0001234',
  95000.00,
  '{"special_pct": 12}'::jsonb
)
ON CONFLICT (employee_id) DO NOTHING;


-- ── 4. Payroll Records (payroll_records) ─────────────────────
-- May 2026 records for all 4 employees
-- id pattern: PAY-{empCode}-{Month}-{Year}

INSERT INTO payroll_records (
  id, employee_id, company_id, month, year,
  basic, hra, conveyance, da, medical, other_allowances, gross_salary,
  lop_days, lop_amount, pf, esi, pt, tds, total_deductions, net_salary,
  attendance, status, processed_date
) VALUES
-- EMP-0001  John Doe Updated — ₹75,000 base
(
  'PAY-EMP-0001-May-2026',
  'ad1a4736-ef0c-4252-a8fd-1b8ab5d359f7',
  'COMP-0001', 'May', 2026,
  37500.00, 15000.00, 1600.00, 7500.00, 1500.00, 7500.00, 70600.00,
  0, 0,
  4500.00, 530.00, 200.00, 0.00, 5230.00, 65370.00,
  '{"present":22,"absent":0,"late":2,"total_working_days":22}'::jsonb,
  'Processed', CURRENT_DATE
),
-- EMP-0002  Srini — ₹60,000 base
(
  'PAY-EMP-0002-May-2026',
  'dc8d7e66-32af-4c42-8b56-31cc2857cfb7',
  'COMP-0001', 'May', 2026,
  30000.00, 12000.00, 1600.00, 6000.00, 1250.00, 6000.00, 56850.00,
  1, 2727.00,
  3600.00, 426.00, 200.00, 0.00, 4226.00, 49897.00,
  '{"present":21,"absent":1,"late":1,"total_working_days":22}'::jsonb,
  'Processed', CURRENT_DATE
),
-- EMP-0003  Sree Man — ₹80,000 base
(
  'PAY-EMP-0003-May-2026',
  '2037e0ac-b188-40f9-9c5d-16c887c072a0',
  'COMP-0001', 'May', 2026,
  40000.00, 16000.00, 2500.00, 8000.00, 1250.00, 8000.00, 75750.00,
  0, 0,
  4800.00, 568.00, 200.00, 0.00, 5568.00, 70182.00,
  '{"present":22,"absent":0,"late":0,"total_working_days":22}'::jsonb,
  'Draft', NULL
),
-- EMP-0004  Sreenivasan — ₹95,000 base
(
  'PAY-EMP-0004-May-2026',
  'a5e35d2e-3d8d-48f2-bc79-82a2b893e1cf',
  'COMP-0001', 'May', 2026,
  47500.00, 19000.00, 3000.00, 9500.00, 2000.00, 11400.00, 92400.00,
  0, 0,
  5700.00, 693.00, 200.00, 0.00, 6593.00, 85807.00,
  '{"present":22,"absent":0,"late":0,"total_working_days":22}'::jsonb,
  'Paid', CURRENT_DATE - INTERVAL '5 days'
)
ON CONFLICT (id) DO NOTHING;


-- ── 5. April 2026 records (historical) ───────────────────────

INSERT INTO payroll_records (
  id, employee_id, company_id, month, year,
  basic, hra, conveyance, da, medical, other_allowances, gross_salary,
  lop_days, lop_amount, pf, esi, pt, tds, total_deductions, net_salary,
  attendance, status, processed_date
) VALUES
(
  'PAY-EMP-0001-April-2026',
  'ad1a4736-ef0c-4252-a8fd-1b8ab5d359f7',
  'COMP-0001', 'April', 2026,
  37500.00, 15000.00, 1600.00, 7500.00, 1500.00, 7500.00, 70600.00,
  0, 0, 4500.00, 530.00, 200.00, 0.00, 5230.00, 65370.00,
  '{"present":22,"absent":0,"late":1,"total_working_days":22}'::jsonb,
  'Paid', CURRENT_DATE - INTERVAL '35 days'
),
(
  'PAY-EMP-0002-April-2026',
  'dc8d7e66-32af-4c42-8b56-31cc2857cfb7',
  'COMP-0001', 'April', 2026,
  30000.00, 12000.00, 1600.00, 6000.00, 1250.00, 6000.00, 56850.00,
  0, 0, 3600.00, 426.00, 200.00, 0.00, 4226.00, 52624.00,
  '{"present":22,"absent":0,"late":0,"total_working_days":22}'::jsonb,
  'Paid', CURRENT_DATE - INTERVAL '35 days'
),
(
  'PAY-EMP-0003-April-2026',
  '2037e0ac-b188-40f9-9c5d-16c887c072a0',
  'COMP-0001', 'April', 2026,
  40000.00, 16000.00, 2500.00, 8000.00, 1250.00, 8000.00, 75750.00,
  0, 0, 4800.00, 568.00, 200.00, 0.00, 5568.00, 70182.00,
  '{"present":22,"absent":0,"late":0,"total_working_days":22}'::jsonb,
  'Paid', CURRENT_DATE - INTERVAL '35 days'
),
(
  'PAY-EMP-0004-April-2026',
  'a5e35d2e-3d8d-48f2-bc79-82a2b893e1cf',
  'COMP-0001', 'April', 2026,
  47500.00, 19000.00, 3000.00, 9500.00, 2000.00, 11400.00, 92400.00,
  0, 0, 5700.00, 693.00, 200.00, 0.00, 6593.00, 85807.00,
  '{"present":21,"absent":1,"late":0,"total_working_days":22}'::jsonb,
  'Paid', CURRENT_DATE - INTERVAL '35 days'
)
ON CONFLICT (id) DO NOTHING;


-- ── 6. Timesheets (timesheets) ───────────────────────────────
-- Sample timesheet entries for May 2026

INSERT INTO timesheets (employee_id, work_date, hours_worked, description, status) VALUES
('ad1a4736-ef0c-4252-a8fd-1b8ab5d359f7', '2026-05-01', 8.00, 'Server infrastructure setup', 'Approved'),
('ad1a4736-ef0c-4252-a8fd-1b8ab5d359f7', '2026-05-02', 9.00, 'Network configuration and testing', 'Approved'),
('ad1a4736-ef0c-4252-a8fd-1b8ab5d359f7', '2026-05-05', 8.00, 'Client meeting and documentation', 'Pending'),
('dc8d7e66-32af-4c42-8b56-31cc2857cfb7', '2026-05-01', 8.00, 'Frontend development - Dashboard module', 'Approved'),
('dc8d7e66-32af-4c42-8b56-31cc2857cfb7', '2026-05-02', 8.50, 'API integration for payroll module', 'Approved'),
('dc8d7e66-32af-4c42-8b56-31cc2857cfb7', '2026-05-05', 7.50, 'Bug fixes and code review', 'Pending'),
('2037e0ac-b188-40f9-9c5d-16c887c072a0', '2026-05-01', 8.00, 'Database optimization', 'Approved'),
('2037e0ac-b188-40f9-9c5d-16c887c072a0', '2026-05-02', 8.00, 'Performance testing and reporting', 'Approved'),
('a5e35d2e-3d8d-48f2-bc79-82a2b893e1cf', '2026-05-01', 9.00, 'Architecture review and planning', 'Approved'),
('a5e35d2e-3d8d-48f2-bc79-82a2b893e1cf', '2026-05-02', 8.00, 'Team coordination and sprint planning', 'Pending');


-- ── Verify counts ─────────────────────────────────────────────
SELECT 'payroll_configs'      AS tbl, COUNT(*) FROM payroll_configs     UNION ALL
SELECT 'salary_structures'    AS tbl, COUNT(*) FROM salary_structures   UNION ALL
SELECT 'employee_payroll_maps'AS tbl, COUNT(*) FROM employee_payroll_maps UNION ALL
SELECT 'payroll_records'      AS tbl, COUNT(*) FROM payroll_records     UNION ALL
SELECT 'timesheets'           AS tbl, COUNT(*) FROM timesheets;
