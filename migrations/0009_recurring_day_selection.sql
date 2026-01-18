-- Add columns for day selection in recurring payments
ALTER TABLE recurring_rules ADD COLUMN interval_type TEXT DEFAULT 'days';
ALTER TABLE recurring_rules ADD COLUMN day_of_week INTEGER;
ALTER TABLE recurring_rules ADD COLUMN day_of_month INTEGER;

-- Migrate existing rules based on interval_days
UPDATE recurring_rules SET interval_type = 'daily' WHERE interval_days = 1;
UPDATE recurring_rules SET interval_type = 'weekly', day_of_week = 1 WHERE interval_days = 7;
UPDATE recurring_rules SET interval_type = 'monthly', day_of_month = 1 WHERE interval_days IN (28, 29, 30, 31);
