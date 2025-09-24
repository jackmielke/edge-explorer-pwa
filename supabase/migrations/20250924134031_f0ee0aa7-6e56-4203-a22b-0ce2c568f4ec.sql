-- Fix security issue: Update characters table policy to require authentication
DROP POLICY "Anyone can view characters for their communities" ON public.characters;

CREATE POLICY "Authenticated users can view characters for their communities" 
ON public.characters 
FOR SELECT 
TO authenticated
USING (
  community_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM community_members cm 
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = characters.community_id 
    AND u.auth_user_id = auth.uid()
  )
);