-- Create table for real-time player positions in communities
CREATE TABLE public.player_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  community_id UUID NOT NULL,
  position_x REAL NOT NULL DEFAULT 0,
  position_y REAL NOT NULL DEFAULT 0,
  position_z REAL NOT NULL DEFAULT 0,
  rotation REAL NOT NULL DEFAULT 0,
  character_glb_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, community_id)
);

-- Enable Row Level Security
ALTER TABLE public.player_positions ENABLE ROW LEVEL SECURITY;

-- Create policies for player positions
CREATE POLICY "Community members can view player positions" 
ON public.player_positions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = player_positions.community_id 
    AND u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can upsert their own position" 
ON public.player_positions 
FOR INSERT 
WITH CHECK (
  user_id IN (
    SELECT u.id FROM users u WHERE u.auth_user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = player_positions.community_id 
    AND u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own position" 
ON public.player_positions 
FOR UPDATE 
USING (
  user_id IN (
    SELECT u.id FROM users u WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own position" 
ON public.player_positions 
FOR DELETE 
USING (
  user_id IN (
    SELECT u.id FROM users u WHERE u.auth_user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE TRIGGER update_player_positions_updated_at
BEFORE UPDATE ON public.player_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for player positions
ALTER PUBLICATION supabase_realtime ADD TABLE player_positions;