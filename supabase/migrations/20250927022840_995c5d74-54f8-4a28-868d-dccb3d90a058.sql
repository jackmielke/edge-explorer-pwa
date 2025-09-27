-- Enhance world_objects table to support physics properties
-- Add physics configuration to the properties jsonb field structure

-- Add some sample physics-enabled objects to demonstrate the enhanced schema
COMMENT ON COLUMN public.world_objects.properties IS 'Enhanced to support physics configuration: 
{
  "color": string,
  "scale": {x, y, z},
  "physics": {
    "collisionType": "solid" | "passthrough" | "platform" | "bouncy",
    "mass": number (default: 1),
    "friction": number (default: 0.3),
    "restitution": number (default: 0.3, bounciness),
    "isStatic": boolean (default: false),
    "interactivity": {
      "canJumpOn": boolean,
      "canPushAround": boolean,
      "triggersEvents": boolean
    }
  }
}';