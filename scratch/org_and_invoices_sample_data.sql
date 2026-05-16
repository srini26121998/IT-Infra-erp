-- ============================================================
--  Sample Data for Departments, Designations, Job Openings, Invoices
--  Run against: it_infra database (port 5000)
-- ============================================================

-- Variables to keep track of IDs
DO $$
DECLARE
  dept_engineering UUID := gen_random_uuid();
  dept_sales UUID := gen_random_uuid();
  dept_hr UUID := gen_random_uuid();

  desig_senior_eng UUID := gen_random_uuid();
  desig_sales_rep UUID := gen_random_uuid();
  desig_hr_manager UUID := gen_random_uuid();
  
  invoice_1 UUID := gen_random_uuid();
  invoice_2 UUID := gen_random_uuid();

BEGIN

-- ── 1. Departments ──────────────────────────────────────────────
INSERT INTO departments (id, name, code, status) VALUES
(dept_engineering, 'Engineering', 'ENG-01', 'Active'),
(dept_sales, 'Sales and Marketing', 'SAL-01', 'Active'),
(dept_hr, 'Human Resources', 'HR-01', 'Active')
ON CONFLICT DO NOTHING;

-- ── 2. Designations ─────────────────────────────────────────────
INSERT INTO designations (id, name, grade, department_id, status) VALUES
(desig_senior_eng, 'Senior Software Engineer', 'Grade A', dept_engineering, 'Active'),
(desig_sales_rep, 'Enterprise Sales Executive', 'Grade B', dept_sales, 'Active'),
(desig_hr_manager, 'HR Manager', 'Grade A', dept_hr, 'Active')
ON CONFLICT DO NOTHING;

-- ── 3. Job Openings ─────────────────────────────────────────────
INSERT INTO job_openings (
  title, department_id, designation_id, openings, job_type, 
  location, description, requirements, salary_range, deadline, status
) VALUES
(
  'Senior Software Engineer - Backend', dept_engineering, desig_senior_eng, 2, 'Full Time',
  'Remote / Bangalore', 'Looking for an experienced backend engineer to scale our microservices.', 
  'Node.js, PostgreSQL, Docker, AWS', '₹20,00,000 - ₹35,00,000', CURRENT_DATE + INTERVAL '30 days', 'Open'
),
(
  'Enterprise Sales Executive', dept_sales, desig_sales_rep, 3, 'Full Time',
  'Mumbai', 'Join our high-performing sales team to close enterprise deals.', 
  'B2B Sales Experience, CRM, Excellent Communication', '₹10,00,000 - ₹15,00,000 + Commission', CURRENT_DATE + INTERVAL '15 days', 'Open'
),
(
  'HR Manager', dept_hr, desig_hr_manager, 1, 'Full Time',
  'Bangalore', 'Lead the HR department and manage employee lifecycle.', 
  '7+ years experience in HR, Conflict Resolution, Compliance', '₹15,00,000 - ₹20,00,000', CURRENT_DATE + INTERVAL '45 days', 'Open'
);

-- ── 4. Invoices ────────────────────────────────────────────────
INSERT INTO invoices (
  id, invoice_number, invoice_date, due_date, 
  customer_id, customer_name, customer_address, customer_email,
  seller_name, seller_address, seller_tax_id,
  subtotal, tax_amount, discount, total_amount, amount_paid, balance_due, 
  status
) VALUES
(
  invoice_1, 'INV-2026-0001', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
  'CUST-001', 'Acme Corporation', '123 Tech Park, Bangalore', 'accounts@acme.corp',
  'InfraERP Tech', '456 Business Street, Bangalore', 'GSTIN1234567890',
  100000.00, 18000.00, 5000.00, 113000.00, 113000.00, 0.00,
  'Paid'
),
(
  invoice_2, 'INV-2026-0002', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days',
  'CUST-002', 'Global Tech Industries', '789 Industrial Area, Mumbai', 'finance@globaltech.in',
  'InfraERP Tech', '456 Business Street, Bangalore', 'GSTIN1234567890',
  250000.00, 45000.00, 0.00, 295000.00, 100000.00, 195000.00,
  'Partial'
);

-- ── 5. Invoice Items ───────────────────────────────────────────
INSERT INTO invoice_items (
  invoice_id, product_name, description, 
  quantity, unit_price, discount, tax_percent, line_total, sort_order
) VALUES
(invoice_1, 'Enterprise Software License', 'Annual subscription for 50 users', 1, 80000.00, 5000.00, 18.00, 88500.00, 1),
(invoice_1, 'Implementation Setup', 'One-time onboarding and setup fee', 1, 20000.00, 0.00, 18.00, 23600.00, 2),

(invoice_2, 'Premium Support SLA', '24/7 dedicated support team', 1, 150000.00, 0.00, 18.00, 177000.00, 1),
(invoice_2, 'Cloud Infrastructure Hosting', 'Dedicated AWS servers for Q3', 1, 100000.00, 0.00, 18.00, 118000.00, 2);

END $$;
