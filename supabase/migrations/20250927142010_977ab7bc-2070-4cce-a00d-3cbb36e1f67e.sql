-- Update function to only show communities the user is a member of
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
  WHERE 
    CASE 
      WHEN user_auth_id IS NOT NULL THEN 
        -- Show only communities the user is a member of
        EXISTS (
          SELECT 1 FROM community_members cm 
          JOIN users u ON cm.user_id = u.id 
          WHERE cm.community_id = c.id AND u.auth_user_id = user_auth_id
        )
      ELSE 
        -- For guests, show all communities
        true
    END
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