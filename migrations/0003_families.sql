-- Families table
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Invite codes for joining families
CREATE TABLE IF NOT EXISTS invite_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  used_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  used_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Add family_id to users
ALTER TABLE users ADD COLUMN family_id TEXT REFERENCES families(id);

-- Add family_id to children
ALTER TABLE children ADD COLUMN family_id TEXT REFERENCES families(id);

-- Add family_id to settings (for per-family settings)
ALTER TABLE settings ADD COLUMN family_id TEXT REFERENCES families(id);

-- Migration: Create a family for each existing user
INSERT INTO families (id, name, created_at)
SELECT id, name || '''s Family', created_at FROM users WHERE family_id IS NULL;

-- Update users to reference their family
UPDATE users SET family_id = id WHERE family_id IS NULL;

-- Update children to use the first user's family (assuming single-user currently)
UPDATE children SET family_id = (SELECT id FROM families LIMIT 1) WHERE family_id IS NULL;

-- Create family settings from global settings
INSERT INTO settings (family_id, currency, pin_enabled, pin_hash, pin_timeout_minutes)
SELECT f.id, s.currency, s.pin_enabled, s.pin_hash, s.pin_timeout_minutes
FROM families f, settings s WHERE s.id = 1 AND f.id NOT IN (SELECT family_id FROM settings WHERE family_id IS NOT NULL);

-- Delete the old global settings row
DELETE FROM settings WHERE id = 1 AND family_id IS NULL;
