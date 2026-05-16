-- ============================================================
--  Sample Subscription Plans for ERP System
--  Run against: it_infra database
-- ============================================================

INSERT INTO subscription_plans (name, price_monthly, features, is_active)
VALUES 
  ('Silver', 1000.00, '["Up to 10 Users", "Basic Support", "Limited Storage"]'::jsonb, true),
  ('Gold', 2500.00, '["Up to 50 Users", "Priority Support", "Advanced Reporting", "100GB Storage"]'::jsonb, true),
  ('Platinum', 5000.00, '["Unlimited Users", "24/7 Dedicated Support", "Custom Integrations", "1TB Storage"]'::jsonb, true),
  ('Enterprise', 10000.00, '["White-label Solution", "On-premise Deployment", "Custom SLA", "Unlimited Everything"]'::jsonb, true)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;
