-- Insert a default character that appears in all communities
INSERT INTO public.characters (
  name,
  description,
  glb_file_url,
  thumbnail_url,
  community_id,
  is_default,
  created_by,
  metadata
) VALUES (
  'Explorer Bot',
  'A friendly robot explorer ready for any adventure across communities',
  '/default-explorer-bot.glb',
  'https://efdqqnubowgwsnwvlalp.supabase.co/storage/v1/object/public/character-models/default-explorer-bot-preview.jpg',
  NULL, -- NULL means it appears in all communities
  true,
  NULL, -- System-created character
  '{"type": "default", "created_by_system": true}'::jsonb
);