-- Enable real-time updates for communities table
ALTER TABLE public.communities REPLICA IDENTITY FULL;

-- Add communities table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;