-- Add most recent community tracking to users table
ALTER TABLE public.users 
ADD COLUMN last_community_id uuid REFERENCES public.communities(id),
ADD COLUMN last_community_visited_at timestamp with time zone;

-- Create index for better performance when querying recent communities
CREATE INDEX idx_users_last_community_visited ON public.users(last_community_visited_at DESC);

-- Create function to update user's most recent community
CREATE OR REPLACE FUNCTION public.update_user_last_community()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's most recent community when they become active in a community
  IF NEW.is_active = true AND (OLD.is_active = false OR OLD.community_id != NEW.community_id) THEN
    UPDATE public.users 
    SET 
      last_community_id = NEW.community_id,
      last_community_visited_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update most recent community
CREATE TRIGGER update_user_last_community_trigger
  AFTER INSERT OR UPDATE ON public.player_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_last_community();