-- Add photo_data column to store base64 encoded images
ALTER TABLE users ADD COLUMN photo_data TEXT;
ALTER TABLE children ADD COLUMN photo_data TEXT;
