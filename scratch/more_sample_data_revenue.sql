-- ============================================================
--  Revenue & Contracts Sample Data for ERP System
--  Run against: erp_db / it_infra database
-- ============================================================

DO $$
DECLARE
  contract_1 UUID := gen_random_uuid();
  contract_2 UUID := gen_random_uuid();
  contract_3 UUID := gen_random_uuid();
  
  amc_1 UUID := gen_random_uuid();
  amc_2 UUID := gen_random_uuid();
  amc_3 UUID := gen_random_uuid();
  
BEGIN

-- ── 1. Contract Management (contracts) ───────────────────────
INSERT INTO contracts (id, contract_number, contract_name, contract_type, client, contract_value, contract_date, start_date, end_date, project_manager, payment_terms, retention_percentage, mobilization_adv_percentage, escalation_clause, penalty_clause, location, status)
VALUES 
  (contract_1, 'CON-2026-001', 'Smart City Network Infrastructure', 'Lump Sum', 'Metro Authority', 5000000.00, CURRENT_DATE - INTERVAL '100 days', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '275 days', 'John Doe Updated', '{"Monthly RA Bills": true}', 5.00, 10.00, true, true, ARRAY['Mumbai'], 'Active'),
  (contract_2, 'CON-2026-002', 'Data Center Cooling System', 'Unit Rate', 'Tech Global Solutions', 1250000.00, CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '150 days', 'Sreenivasan', '{"Quarterly": true}', 10.00, 0.00, false, true, ARRAY['Bangalore'], 'Active'),
  (contract_3, 'CON-2026-003', 'Enterprise Security Upgrades', 'Lump Sum', 'FinTrust Bank', 850000.00, CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '210 days', 'Sree Man', '{"Milestones": true}', 5.00, 15.00, false, false, ARRAY['Chennai', 'Pune'], 'Pre-Award')
ON CONFLICT (contract_number) DO NOTHING;

-- ── 2. RA Billing / Revenue (ra_bills) ────────────────────────
-- RA Bill 1 for Contract 1
INSERT INTO ra_bills (bill_number, contract_id, bill_period, bill_date, work_completion_percentage, gross_amount, previous_bills_amount, advance_deduction, retention_amount, gst_percentage, cgst_amount, sgst_amount, tds_percentage, tds_amount, total_invoice_value, status)
VALUES 
  ('RA-CON01-001', contract_1, 'March 2026', CURRENT_DATE - INTERVAL '60 days', 10.00, 500000.00, 0.00, 50000.00, 25000.00, 18.00, 38250.00, 38250.00, 2.00, 8500.00, 493000.00, 'Paid'),
  
  ('RA-CON01-002', contract_1, 'April 2026', CURRENT_DATE - INTERVAL '30 days', 25.00, 750000.00, 500000.00, 75000.00, 37500.00, 18.00, 57375.00, 57375.00, 2.00, 12750.00, 739500.00, 'Authorized'),

  ('RA-CON01-003', contract_1, 'May 2026', CURRENT_DATE, 40.00, 750000.00, 1250000.00, 75000.00, 37500.00, 18.00, 57375.00, 57375.00, 2.00, 12750.00, 739500.00, 'Submitted'),

-- RA Bill 1 for Contract 2
  ('RA-CON02-001', contract_2, 'April 2026', CURRENT_DATE - INTERVAL '15 days', 15.00, 187500.00, 0.00, 0.00, 18750.00, 18.00, 15187.50, 15187.50, 2.00, 3375.00, 195750.00, 'Paid')
ON CONFLICT (bill_number) DO NOTHING;

-- ── 3. AMC Contracts (amc_contracts) ──────────────────────────
INSERT INTO amc_contracts (id, amc_number, amc_name, customer, amc_type, number_of_units, start_date, end_date, total_amc_value, payment_frequency, response_time_sla, resolution_time_sla, penalty_per_hour, auto_renewal, status)
VALUES 
  (amc_1, 'AMC-2026-001', 'Network Switches Maintenance', 'Cyber Security Inc', 'Comprehensive', 25, CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE + INTERVAL '185 days', 120000.00, 'Quarterly', 4, 24, 500.00, true, 'Active'),
  (amc_2, 'AMC-2026-002', 'CCTV Infrastructure Support', 'Metro Mall', 'Non-Comprehensive', 150, CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE + INTERVAL '315 days', 75000.00, 'Monthly', 8, 48, 200.00, false, 'Active'),
  (amc_3, 'AMC-2026-003', 'Server Hardware Warranty', 'Global Tech Solutions', 'Comprehensive', 5, CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '395 days', 450000.00, 'Annually', 2, 8, 2000.00, true, 'Pending')
ON CONFLICT (amc_number) DO NOTHING;

-- ── 4. AMC Service Tickets (amc_service_tickets) ──────────────
INSERT INTO amc_service_tickets (ticket_number, amc_id, call_date_time, call_type, equipment_unit, reported_by, contact_number, problem_description, priority, assigned_to, response_due_by, resolution_due_by, status)
VALUES 
  ('AMCT-2026-001', amc_1, CURRENT_DATE - INTERVAL '2 days', 'Breakdown', 'Switch-Core-01', 'IT Admin', '9876543210', 'Core switch is restarting randomly', 'High', 'Sreenivasan', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '4 hours', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '24 hours', 'In Progress'),
  
  ('AMCT-2026-002', amc_2, CURRENT_DATE - INTERVAL '10 days', 'Preventive', 'CCTV-Zone-A', 'Security Head', '9123456780', 'Monthly routine cleaning and checkup', 'Medium', 'Srini', CURRENT_DATE - INTERVAL '10 days' + INTERVAL '8 hours', CURRENT_DATE - INTERVAL '10 days' + INTERVAL '48 hours', 'Resolved')
ON CONFLICT (ticket_number) DO NOTHING;

END $$;
