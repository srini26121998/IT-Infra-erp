-- ============================================================
--  Migration 010 — Branches, Invoices, and RBAC
-- ============================================================

-- ── Organizational — Branches (Extensions) ──────────────────
ALTER TABLE branches ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS location VARCHAR(150);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS manager VARCHAR(150);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS coordinates VARCHAR(50);

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branches_code_unique') THEN
    ALTER TABLE branches ADD CONSTRAINT branches_code_unique UNIQUE (code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_branches_company ON branches(company_id) WHERE deleted_at IS NULL;

-- ── Finance — Invoices ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number    VARCHAR(30)    UNIQUE NOT NULL,
  invoice_date      DATE           NOT NULL,
  due_date          DATE           NOT NULL,
  customer_id       VARCHAR(50)    NOT NULL,
  customer_name     VARCHAR(150)   NOT NULL,
  customer_address  TEXT,
  customer_email    VARCHAR(255),
  customer_phone    VARCHAR(20),
  customer_tax_id   VARCHAR(30),
  seller_name       VARCHAR(150)   NOT NULL,
  seller_address    TEXT           NOT NULL,
  seller_phone      VARCHAR(20),
  seller_email      VARCHAR(255),
  seller_tax_id     VARCHAR(30)    NOT NULL,
  subtotal          NUMERIC(14,2)  NOT NULL DEFAULT 0,
  tax_amount        NUMERIC(14,2)  NOT NULL DEFAULT 0,
  discount          NUMERIC(14,2)  NOT NULL DEFAULT 0,
  total_amount      NUMERIC(14,2)  NOT NULL DEFAULT 0,
  amount_paid       NUMERIC(14,2)  NOT NULL DEFAULT 0,
  balance_due       NUMERIC(14,2)  NOT NULL DEFAULT 0,
  status            VARCHAR(20)    NOT NULL DEFAULT 'Draft', -- Draft|Sent|Paid|Partially Paid|Overdue|Cancelled
  payment_terms     VARCHAR(50),
  notes             TEXT,
  terms_conditions  TEXT,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID           NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_name  VARCHAR(200)   NOT NULL,
  description   TEXT,
  quantity      NUMERIC(10,2)  NOT NULL,
  unit_price    NUMERIC(12,2)  NOT NULL,
  discount      NUMERIC(12,2)  NOT NULL DEFAULT 0,
  tax_percent   NUMERIC(5,2)   NOT NULL DEFAULT 0,
  line_total    NUMERIC(14,2)  NOT NULL,
  sort_order    INTEGER        NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoice_payments (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID           NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_date    DATE           NOT NULL,
  amount          NUMERIC(14,2)  NOT NULL,
  payment_mode    VARCHAR(30)    NOT NULL, -- Cash|Card|UPI|Bank Transfer
  reference_no    VARCHAR(100),
  card_type       VARCHAR(20),
  card_last4      VARCHAR(4),
  upi_id          VARCHAR(100),
  bank_name       VARCHAR(100),
  transaction_id  VARCHAR(100),
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_status   ON invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_inv_items_inv     ON invoice_items(invoice_id);

-- ── Admin — Roles & Permissions ─────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id           SERIAL         PRIMARY KEY,
  name         VARCHAR(100)   NOT NULL UNIQUE,
  description  TEXT,
  permissions  TEXT[]         NOT NULL DEFAULT '{}',
  status       VARCHAR(20)    NOT NULL DEFAULT 'Active',
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Seed built-in roles
INSERT INTO roles (name, permissions, status) VALUES 
('Super Admin', ARRAY['all'], 'Active'),
('HR Manager', ARRAY['view_employees','edit_employees','view_dashboard','view_leave','approve_leave'], 'Active'),
('IT Admin',   ARRAY['view_assets','edit_assets','view_dashboard'], 'Active'),
('Employee',   ARRAY['view_self','view_dashboard'], 'Active')
ON CONFLICT (name) DO NOTHING;
