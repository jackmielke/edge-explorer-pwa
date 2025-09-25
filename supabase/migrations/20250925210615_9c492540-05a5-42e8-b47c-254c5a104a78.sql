-- Remove the problematic Explorer Bot character
DELETE FROM characters WHERE name = 'Explorer Bot' AND glb_file_url = '/default-explorer-bot.glb';

-- Set Eddie as the default character
UPDATE characters 
SET is_default = true 
WHERE name = 'Eddie';