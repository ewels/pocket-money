-- Add PIN columns to users table
ALTER TABLE users ADD COLUMN pin_enabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN pin_hash TEXT;
ALTER TABLE users ADD COLUMN pin_timeout_minutes INTEGER DEFAULT 5;

-- Migrate existing family PINs to all users in those families
UPDATE users
SET pin_enabled = (SELECT s.pin_enabled FROM settings s WHERE users.family_id = s.family_id),
    pin_hash = (SELECT s.pin_hash FROM settings s WHERE users.family_id = s.family_id),
    pin_timeout_minutes = (SELECT s.pin_timeout_minutes FROM settings s WHERE users.family_id = s.family_id)
WHERE family_id IN (SELECT family_id FROM settings WHERE pin_enabled = 1);
