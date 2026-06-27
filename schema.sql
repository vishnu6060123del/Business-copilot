-- AI Procurement Copilot – Contract Intelligence Edition
-- Role-based relational schema compatible with Amazon Aurora PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'vendor')),
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    value DECIMAL(15,2) NOT NULL CHECK (value >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_terms VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    title VARCHAR(500),
    extracted_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contracts_vendor_id ON contracts(vendor_id);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_contracts_category ON contracts(category);

CREATE TABLE spend (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spend_vendor_id ON spend(vendor_id);
CREATE INDEX idx_spend_date ON spend(date);
CREATE INDEX idx_spend_category ON spend(category);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL CHECK (price >= 0),
    unit VARCHAR(50),
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category);

CREATE TABLE requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    budget DECIMAL(15,2),
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_requirements_category ON requirements(category);
CREATE INDEX idx_requirements_status ON requirements(status);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL CHECK (plan IN ('Starter', 'Growth', 'Enterprise')),
    price DECIMAL(15,2) NOT NULL,
    renew_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_vendor_id ON subscriptions(vendor_id);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    date DATE NOT NULL,
    method VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_vendor_id ON payments(vendor_id);
CREATE INDEX idx_payments_date ON payments(date);

-- Materialized view for analytics (refresh nightly or on demand)
CREATE MATERIALIZED VIEW vendor_spend_summary AS
SELECT
    v.id AS vendor_id,
    v.name AS vendor_name,
    v.category,
    v.rating,
    COALESCE(SUM(s.amount), 0) AS total_spend,
    COALESCE(AVG(s.amount), 0) AS avg_monthly_spend,
    COUNT(s.id) AS transaction_count
FROM vendors v
LEFT JOIN spend s ON v.id = s.vendor_id
GROUP BY v.id, v.name, v.category, v.rating;

CREATE UNIQUE INDEX idx_vendor_spend_summary_vendor_id ON vendor_spend_summary(vendor_id);

-- Example AI-generated queries

-- 1. Contracts expiring within 30 days
-- SELECT c.*, v.name
-- FROM contracts c
-- JOIN vendors v ON c.vendor_id = v.id
-- WHERE c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
-- ORDER BY c.end_date;

-- 2. Most expensive supplier
-- SELECT v.name, SUM(s.amount) AS total_spend
-- FROM spend s
-- JOIN vendors v ON s.vendor_id = v.id
-- GROUP BY v.name
-- ORDER BY total_spend DESC
-- LIMIT 1;

-- 3. Open requirements for a vendor category
-- SELECT * FROM requirements
-- WHERE category = 'Manufacturing' AND status = 'open';
