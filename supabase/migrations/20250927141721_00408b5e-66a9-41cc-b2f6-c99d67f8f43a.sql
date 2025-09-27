-- Remove the last community tracking functionality
ALTER TABLE public.users DROP COLUMN IF EXISTS last_community_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS last_community_visited_at;

-- Drop the trigger and function for last community tracking
DROP TRIGGER IF EXISTS update_user_last_community_trigger ON public.player_positions;
DROP FUNCTION IF EXISTS public.update_user_last_community();

-- Drop the get_communities_with_recent_activity function
DROP FUNCTION IF EXISTS public.get_communities_with_recent_activity(uuid, integer);

-- Create community_favorites table
CREATE TABLE public.community_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  community_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, community_id)
);

-- Enable RLS
ALTER TABLE public.community_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for community_favorites
CREATE POLICY "Users can manage their own favorites" 
ON public.community_favorites 
FOR ALL 
USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Create function to get communities with favorites for a user
CREATE OR REPLACE FUNCTION public.get_communities_with_favorites(
  user_auth_id uuid DEFAULT NULL,
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  cover_image_url text,
  game_design_sky_color text,
  is_favorited boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    c.description,
    c.cover_image_url,
    c.game_design_sky_color,
    CASE 
      WHEN user_auth_id IS NOT NULL THEN 
        EXISTS (
          SELECT 1 FROM community_favorites cf 
          JOIN users u ON cf.user_id = u.id 
          WHERE cf.community_id = c.id AND u.auth_user_id = user_auth_id
        )
      ELSE false
    END as is_favorited
  FROM communities c
  ORDER BY 
    CASE 
      WHEN user_auth_id IS NOT NULL THEN 
        (EXISTS (
          SELECT 1 FROM community_favorites cf 
          JOIN users u ON cf.user_id = u.id 
          WHERE cf.community_id = c.id AND u.auth_user_id = user_auth_id
        ))::int
      ELSE 0
    END DESC,
    c.name ASC
  LIMIT limit_count;
$$;