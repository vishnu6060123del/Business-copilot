-- Demo seed data for AI Procurement Copilot.
-- Safe to rerun in a demo database.

TRUNCATE TABLE spend, contracts, vendors CASCADE;

INSERT INTO vendors (id, name, rating, category) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Acme Office Supplies', 4.2, 'Office Supplies'),
  ('00000000-0000-0000-0000-000000000002', 'TechGiant IT', 4.5, 'Technology'),
  ('00000000-0000-0000-0000-000000000003', 'Global Logistics Inc', 3.9, 'Logistics'),
  ('00000000-0000-0000-0000-000000000004', 'GreenEnergy Utilities', 4.1, 'Utilities'),
  ('00000000-0000-0000-0000-000000000005', 'SafeGuard Security', 4.0, 'Security'),
  ('00000000-0000-0000-0000-000000000006', 'MarketPro Agency', 3.7, 'Marketing'),
  ('00000000-0000-0000-0000-000000000007', 'CloudScale SaaS', 4.6, 'Technology'),
  ('00000000-0000-0000-0000-000000000008', 'ProClean Facilities', 3.8, 'Facilities'),
  ('00000000-0000-0000-0000-000000000009', 'SteelWorks Manufacturing', 4.3, 'Manufacturing'),
  ('00000000-0000-0000-0000-000000000010', 'LegalEagle Services', 4.4, 'Professional Services'),
  ('00000000-0000-0000-0000-000000000011', 'DataVault Storage', 4.0, 'Technology'),
  ('00000000-0000-0000-0000-000000000012', 'FastFleet Transport', 3.6, 'Logistics');

INSERT INTO contracts (vendor_id, value, start_date, end_date, payment_terms, category) VALUES
  ('00000000-0000-0000-0000-000000000001', 48000, CURRENT_DATE - INTERVAL '12 months', CURRENT_DATE + INTERVAL '14 days', 'Net 30', 'Office Supplies'),
  ('00000000-0000-0000-0000-000000000002', 245000, CURRENT_DATE - INTERVAL '18 months', CURRENT_DATE + INTERVAL '45 days', 'Net 45', 'Technology'),
  ('00000000-0000-0000-0000-000000000003', 180000, CURRENT_DATE - INTERVAL '10 months', CURRENT_DATE + INTERVAL '120 days', 'Net 30', 'Logistics'),
  ('00000000-0000-0000-0000-000000000004', 95000, CURRENT_DATE - INTERVAL '24 months', CURRENT_DATE + INTERVAL '8 days', 'Net 15', 'Utilities'),
  ('00000000-0000-0000-0000-000000000005', 62000, CURRENT_DATE - INTERVAL '8 months', CURRENT_DATE + INTERVAL '200 days', 'Net 30', 'Security'),
  ('00000000-0000-0000-0000-000000000006', 120000, CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '22 days', 'Net 45', 'Marketing'),
  ('00000000-0000-0000-0000-000000000007', 78000, CURRENT_DATE - INTERVAL '11 months', CURRENT_DATE + INTERVAL '90 days', 'Net 30', 'Technology'),
  ('00000000-0000-0000-0000-000000000008', 36000, CURRENT_DATE - INTERVAL '14 months', CURRENT_DATE + INTERVAL '5 days', 'Net 15', 'Facilities'),
  ('00000000-0000-0000-0000-000000000009', 310000, CURRENT_DATE - INTERVAL '20 months', CURRENT_DATE + INTERVAL '160 days', 'Net 60', 'Manufacturing'),
  ('00000000-0000-0000-0000-000000000010', 55000, CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE + INTERVAL '60 days', 'Net 15', 'Professional Services'),
  ('00000000-0000-0000-0000-000000000011', 42000, CURRENT_DATE - INTERVAL '9 months', CURRENT_DATE + INTERVAL '18 days', 'Net 30', 'Technology'),
  ('00000000-0000-0000-0000-000000000012', 150000, CURRENT_DATE - INTERVAL '7 months', CURRENT_DATE + INTERVAL '110 days', 'Net 30', 'Logistics');

WITH base_spend(vendor_id, monthly_amount, category) AS (
  VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid, 3800::numeric, 'Office Supplies'),
    ('00000000-0000-0000-0000-000000000002'::uuid, 18000::numeric, 'Technology'),
    ('00000000-0000-0000-0000-000000000003'::uuid, 14000::numeric, 'Logistics'),
    ('00000000-0000-0000-0000-000000000004'::uuid, 7500::numeric, 'Utilities'),
    ('00000000-0000-0000-0000-000000000005'::uuid, 4800::numeric, 'Security'),
    ('00000000-0000-0000-0000-000000000006'::uuid, 9500::numeric, 'Marketing'),
    ('00000000-0000-0000-0000-000000000007'::uuid, 6000::numeric, 'Technology'),
    ('00000000-0000-0000-0000-000000000008'::uuid, 2800::numeric, 'Facilities'),
    ('00000000-0000-0000-0000-000000000009'::uuid, 24000::numeric, 'Manufacturing'),
    ('00000000-0000-0000-0000-000000000010'::uuid, 4200::numeric, 'Professional Services'),
    ('00000000-0000-0000-0000-000000000011'::uuid, 3300::numeric, 'Technology'),
    ('00000000-0000-0000-0000-000000000012'::uuid, 11500::numeric, 'Logistics')
), months AS (
  SELECT generate_series(0, 11) AS month_offset
)
INSERT INTO spend (vendor_id, amount, date, category)
SELECT
  base_spend.vendor_id,
  ROUND(base_spend.monthly_amount * (0.85 + random() * 0.30), 2),
  (DATE_TRUNC('month', CURRENT_DATE) - (months.month_offset || ' months')::interval)::date,
  base_spend.category
FROM base_spend
CROSS JOIN months;

REFRESH MATERIALIZED VIEW vendor_spend_summary;