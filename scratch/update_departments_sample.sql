-- ============================================================
--  Sample Update Script for Departments 
--  Run against: erp_db / it_infra database
-- ============================================================

-- This script maps the existing employees to be the 'head' of existing departments
-- and sets up a sample parent-child department relationship.

-- 1. Set Heads of Departments
-- Engineering (ENG-01) -> John Doe Updated
UPDATE departments 
SET head_employee_id = 'ad1a4736-ef0c-4252-a8fd-1b8ab5d359f7' 
WHERE name = 'Engineering';

-- Human Resources (HR-01) -> Sree Man
UPDATE departments 
SET head_employee_id = '2037e0ac-b188-40f9-9c5d-16c887c072a0' 
WHERE name = 'Human Resources';

-- Sales and Marketing (SAL-01) -> Sreenivasan
UPDATE departments 
SET head_employee_id = 'a5e35d2e-3d8d-48f2-bc79-82a2b893e1cf' 
WHERE name = 'Sales and Marketing';

-- Computer (CSE) -> Srini
UPDATE departments 
SET head_employee_id = 'dc8d7e66-32af-4c42-8b56-31cc2857cfb7' 
WHERE name = 'Computer';

-- 2. Set Parent Departments (e.g. Computer is under Engineering)
UPDATE departments
SET parent_department_id = (SELECT id FROM departments WHERE name = 'Engineering')
WHERE name = 'Computer';
