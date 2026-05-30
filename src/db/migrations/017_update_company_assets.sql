-- Add missing columns to company_assets
ALTER TABLE company_assets
ADD COLUMN IF NOT EXISTS company_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT;
