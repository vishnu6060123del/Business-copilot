-- Aurora DSQL schema for the Business Procurement Copilot.
-- DSQL rules applied: string PKs (no SERIAL/sequences), no foreign keys,
-- no extensions/triggers, one DDL per transaction (COMMIT), async indexes.

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255),
  phone VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  vendor_id VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
COMMIT;

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
COMMIT;

CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  rating NUMERIC(3,2) NOT NULL DEFAULT 4.0,
  category VARCHAR(120) NOT NULL
);
COMMIT;

CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR(100) PRIMARY KEY,
  vendor_id VARCHAR(100) NOT NULL,
  value NUMERIC(14,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_terms VARCHAR(60),
  category VARCHAR(120) NOT NULL,
  title VARCHAR(255)
);
COMMIT;

CREATE TABLE IF NOT EXISTS spend (
  id VARCHAR(100) PRIMARY KEY,
  vendor_id VARCHAR(100) NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  category VARCHAR(120) NOT NULL
);
COMMIT;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  vendor_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(500),
  price NUMERIC(14,2) NOT NULL DEFAULT 0,
  unit VARCHAR(60),
  category VARCHAR(120) NOT NULL
);
COMMIT;

CREATE TABLE IF NOT EXISTS requirements (
  id VARCHAR(100) PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  category VARCHAR(120) NOT NULL,
  budget NUMERIC(14,2),
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
);
COMMIT;

CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(100) PRIMARY KEY,
  vendor_id VARCHAR(100) NOT NULL,
  plan VARCHAR(40) NOT NULL,
  price NUMERIC(14,2) NOT NULL DEFAULT 0,
  renew_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
);
COMMIT;

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(100) PRIMARY KEY,
  vendor_id VARCHAR(100) NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  method VARCHAR(60),
  description VARCHAR(255)
);
COMMIT;

CREATE INDEX ASYNC IF NOT EXISTS idx_sessions_user ON sessions(user_id);
COMMIT;

CREATE INDEX ASYNC IF NOT EXISTS idx_contracts_vendor ON contracts(vendor_id);
COMMIT;

CREATE INDEX ASYNC IF NOT EXISTS idx_spend_vendor ON spend(vendor_id);
COMMIT;

CREATE INDEX ASYNC IF NOT EXISTS idx_products_vendor ON products(vendor_id);
COMMIT;

CREATE INDEX ASYNC IF NOT EXISTS idx_payments_vendor ON payments(vendor_id);
COMMIT;

CREATE INDEX ASYNC IF NOT EXISTS idx_subscriptions_vendor ON subscriptions(vendor_id);
COMMIT;

CREATE INDEX ASYNC IF NOT EXISTS idx_users_email ON users(email);
COMMIT;
