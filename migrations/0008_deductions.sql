-- Create deductions table
CREATE TABLE IF NOT EXISTS deductions (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  description TEXT,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_deductions_child_id ON deductions(child_id);

-- Migrate existing skip_next=1 to deductions
INSERT INTO deductions (id, child_id, amount, description, created_by, created_at)
SELECT
  lower(hex(randomblob(16))) as id,
  child_id,
  amount,
  'Migrated from skip next',
  NULL,
  unixepoch()
FROM recurring_rules
WHERE skip_next = 1 AND active = 1;

-- Remove skip_next column (SQLite table recreation)
CREATE TABLE recurring_rules_new (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  description TEXT,
  interval_days INTEGER NOT NULL,
  next_run_at INTEGER NOT NULL,
  active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

INSERT INTO recurring_rules_new SELECT id, child_id, amount, description, interval_days, next_run_at, active, created_at FROM recurring_rules;
DROP TABLE recurring_rules;
ALTER TABLE recurring_rules_new RENAME TO recurring_rules;
