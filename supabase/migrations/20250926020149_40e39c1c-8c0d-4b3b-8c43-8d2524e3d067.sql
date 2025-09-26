-- Add game design sky color field to communities table
ALTER TABLE public.communities 
ADD COLUMN game_design_sky_color text DEFAULT '#87CEEB';