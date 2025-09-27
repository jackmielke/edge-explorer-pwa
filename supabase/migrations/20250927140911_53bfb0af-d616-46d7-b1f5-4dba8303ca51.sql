-- Create function to get communities ordered by user's recent activity
CREATE OR REPLACE FUNCTION public.get_communities_with_recent_activity(
  user_auth_id uuid,
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  cover_image_url text,
  game_design_sky_color text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_data AS (
    SELECT u.id as user_id, u.last_community_id
    FROM users u 
    WHERE u.auth_user_id = user_auth_id
  )
  SELECT 
    c.id,
    c.name,
    c.description,
    c.cover_image_url,
    c.game_design_sky_color
  FROM communities c
  LEFT JOIN user_data ud ON c.id = ud.last_community_id
  ORDER BY 
    CASE WHEN c.id = ud.last_community_id THEN 1 ELSE 2 END,
    c.name ASC
  LIMIT limit_count;
$$;