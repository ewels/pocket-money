-- Add webhook URL to settings
ALTER TABLE settings ADD COLUMN webhook_url TEXT;
