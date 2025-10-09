-- Add reality control settings to communities table
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS game_design_gravity_y numeric DEFAULT -9.81,
ADD COLUMN IF NOT EXISTS game_design_time_scale numeric DEFAULT 1.0;