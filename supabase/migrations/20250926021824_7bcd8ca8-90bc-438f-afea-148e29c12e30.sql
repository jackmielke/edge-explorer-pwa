-- Create world_objects table for spawning 3D objects in the game world
CREATE TABLE public.world_objects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL, -- 'box', 'sphere', 'cylinder', 'cone', etc.
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}', -- 3D position
  properties JSONB NOT NULL DEFAULT '{}', -- color, scale, rotation, materials, etc.
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.world_objects ENABLE ROW LEVEL SECURITY;

-- Community members can view objects in their communities
CREATE POLICY "Community members can view world objects" 
ON public.world_objects 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = world_objects.community_id 
    AND u.auth_user_id = auth.uid()
  )
);

-- Community members can create objects in their communities
CREATE POLICY "Community members can create world objects" 
ON public.world_objects 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = world_objects.community_id 
    AND u.auth_user_id = auth.uid()
  )
  AND created_by IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Users can update their own objects
CREATE POLICY "Users can update their own world objects" 
ON public.world_objects 
FOR UPDATE 
USING (
  created_by IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Users can delete their own objects, or community admins can delete any
CREATE POLICY "Users can delete world objects" 
ON public.world_objects 
FOR DELETE 
USING (
  created_by IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
  OR is_community_admin(community_id, auth.uid())
);

-- Add updated_at trigger
CREATE TRIGGER update_world_objects_updated_at
BEFORE UPDATE ON public.world_objects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time updates
ALTER TABLE public.world_objects REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.world_objects;