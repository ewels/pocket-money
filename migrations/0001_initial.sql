-- Parent accounts
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- App settings (single row)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  currency TEXT DEFAULT 'EUR',
  pin_enabled INTEGER DEFAULT 0,
  pin_hash TEXT,
  pin_timeout_minutes INTEGER DEFAULT 1
);

-- Children profiles
CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  photo_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Saving targets per child
CREATE TABLE IF NOT EXISTS saving_targets (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Recurring payment rules
CREATE TABLE IF NOT EXISTS recurring_rules (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  description TEXT,
  interval_days INTEGER NOT NULL,
  next_run_at INTEGER NOT NULL,
  skip_next INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

-- All money transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  amount REAL NOT NULL,
  description TEXT,
  is_recurring INTEGER DEFAULT 0,
  recurring_rule_id TEXT REFERENCES recurring_rules(id),
  created_at INTEGER DEFAULT (unixepoch())
);

-- Sessions for auth
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pin_verified_at INTEGER,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Insert default settings
INSERT OR IGNORE INTO settings (id) VALUES (1);
