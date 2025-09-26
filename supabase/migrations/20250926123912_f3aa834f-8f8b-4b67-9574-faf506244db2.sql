-- Add default Eddie character if it doesn't exist
INSERT INTO public.characters (
  id,
  name,
  description,
  glb_file_url,
  thumbnail_url,
  is_default,
  community_id,
  created_by
) VALUES (
  gen_random_uuid(),
  'Eddie',
  'Default explorer character',
  'https://efdqqnubowgwsnwvlalp.supabase.co/storage/v1/object/public/character-models/18f08f2d-f922-4c83-83ea-8ce2afdfc520/1758721690787_3d eddie.glb',
  null,
  true,
  null,
  null
) ON CONFLICT DO NOTHING;

-- Add RLS policy for guests to view world objects in public communities
CREATE POLICY "Guests can view world objects in public communities"
ON public.world_objects
FOR SELECT
USING (
  -- If user is authenticated, use existing community member policy
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM (community_members cm JOIN users u ON ((cm.user_id = u.id)))
    WHERE ((cm.community_id = world_objects.community_id) AND (u.auth_user_id = auth.uid()))
  ))
  OR
  -- If user is not authenticated (guest), allow viewing objects in public communities
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM communities c
    WHERE c.id = world_objects.community_id AND c.privacy_level = 'public'
  ))
);

-- Add RLS policy for guests to view characters
CREATE POLICY "Guests can view default and public characters"
ON public.characters
FOR SELECT
USING (
  -- Existing policy for authenticated users
  ((community_id IS NULL) OR (EXISTS ( SELECT 1
   FROM (community_members cm
     JOIN users u ON ((cm.user_id = u.id)))
  WHERE ((cm.community_id = characters.community_id) AND (u.auth_user_id = auth.uid())))))
  OR
  -- Allow guests to see default characters and characters with no community
  (auth.uid() IS NULL AND (is_default = true OR community_id IS NULL))
);