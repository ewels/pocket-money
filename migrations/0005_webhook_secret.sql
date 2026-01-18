-- Add webhook secret for signature verification
ALTER TABLE settings ADD COLUMN webhook_secret TEXT;
