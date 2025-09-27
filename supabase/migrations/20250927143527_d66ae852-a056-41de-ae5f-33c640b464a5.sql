-- Remove duplicate Eddie character, keeping only one
DELETE FROM characters 
WHERE id = '3512d3e6-8c88-4c9d-b4d2-db35b770e076';

-- Update the remaining Eddie character with new thumbnail
UPDATE characters 
SET 
  thumbnail_url = 'https://efdqqnubowgwsnwvlalp.supabase.co/storage/v1/object/public/character-models/walking-tour-eddie.png',
  description = 'Default explorer character'
WHERE id = '3c2d59d2-84dc-41f0-87d9-2102fd616f6e';