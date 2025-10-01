-- Add vibecoin balance to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS vibecoin_balance INTEGER DEFAULT 0 NOT NULL;

-- Create vibecoin_pickups table to track spawned coins
CREATE TABLE IF NOT EXISTS public.vibecoin_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  position_z REAL NOT NULL,
  is_collected BOOLEAN DEFAULT false,
  collected_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  collected_at TIMESTAMP WITH TIME ZONE,
  respawn_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.vibecoin_pickups ENABLE ROW LEVEL SECURITY;

-- Community members can view pickups
CREATE POLICY "Community members can view vibecoin pickups"
ON public.vibecoin_pickups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = vibecoin_pickups.community_id
    AND u.auth_user_id = auth.uid()
  )
);

-- Community members can collect coins (update)
CREATE POLICY "Community members can collect vibecoins"
ON public.vibecoin_pickups
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = vibecoin_pickups.community_id
    AND u.auth_user_id = auth.uid()
  )
);

-- Admins can insert/spawn coins
CREATE POLICY "Admins can spawn vibecoins"
ON public.vibecoin_pickups
FOR INSERT
WITH CHECK (
  is_community_admin(community_id, auth.uid())
);

-- Create trigger to update updated_at
CREATE TRIGGER update_vibecoin_pickups_updated_at
  BEFORE UPDATE ON public.vibecoin_pickups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial coins for existing communities
INSERT INTO public.vibecoin_pickups (community_id, position_x, position_y, position_z)
SELECT id, 
  (random() * 8 - 4)::REAL,
  0.5::REAL,
  (random() * 8 - 4)::REAL
FROM public.communities
WHERE NOT EXISTS (
  SELECT 1 FROM public.vibecoin_pickups WHERE community_id = communities.id
)
LIMIT 5;