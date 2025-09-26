-- Add policy to allow guests to create world objects in public communities
CREATE POLICY "Guests can create world objects in public communities" 
ON public.world_objects 
FOR INSERT 
WITH CHECK (
  -- For authenticated users, use existing logic
  (auth.uid() IS NOT NULL AND (
    (EXISTS ( 
      SELECT 1
      FROM (community_members cm JOIN users u ON ((cm.user_id = u.id)))
      WHERE ((cm.community_id = world_objects.community_id) AND (u.auth_user_id = auth.uid()))
    )) AND (created_by IN ( 
      SELECT users.id
      FROM users
      WHERE (users.auth_user_id = auth.uid())
    ))
  ))
  OR
  -- For guests (no auth), allow creation in public communities with null created_by
  (auth.uid() IS NULL AND (
    EXISTS ( 
      SELECT 1 
      FROM communities c
      WHERE c.id = world_objects.community_id 
      AND c.privacy_level = 'public'
    )
  ) AND created_by IS NULL)
);