-- Add time of day and timezone for recurring payments
ALTER TABLE recurring_rules ADD COLUMN time_of_day INTEGER DEFAULT 7;
ALTER TABLE recurring_rules ADD COLUMN timezone TEXT DEFAULT 'Europe/London';
