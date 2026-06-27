-- AI Procurement Copilot - Contract Intelligence Edition
-- Aurora PostgreSQL schema for the serverless backend.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  rating DOUBLE PRECISION NOT NULL DEFAULT 4.0 CHECK (rating >= 0 AND rating <= 5),
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  value NUMERIC(14,2) NOT NULL CHECK (value >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_terms VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_id ON contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_category ON contracts(category);
CREATE INDEX IF NOT EXISTS idx_spend_vendor_id ON spend(vendor_id);
CREATE INDEX IF NOT EXISTS idx_spend_date ON spend(date);
CREATE INDEX IF NOT EXISTS idx_spend_category ON spend(category);
CREATE INDEX IF NOT EXISTS idx_spend_vendor_date ON spend(vendor_id, date DESC);

-- Read-optimized analytical view. Refresh after large imports or nightly.
CREATE MATERIALIZED VIEW IF NOT EXISTS vendor_spend_summary AS
SELECT
  v.id AS vendor_id,
  v.name AS vendor_name,
  v.category,
  v.rating,
  COALESCE(SUM(s.amount), 0) AS total_spend,
  COALESCE(AVG(s.amount), 0) AS average_spend,
  COUNT(s.id) AS spend_record_count
FROM vendors v
LEFT JOIN spend s ON s.vendor_id = v.id
GROUP BY v.id, v.name, v.category, v.rating
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_spend_summary_vendor_id
  ON vendor_spend_summary(vendor_id);