-- Add additional fields to saving_targets
ALTER TABLE saving_targets ADD COLUMN photo_data TEXT;
ALTER TABLE saving_targets ADD COLUMN description TEXT;
ALTER TABLE saving_targets ADD COLUMN link TEXT;
