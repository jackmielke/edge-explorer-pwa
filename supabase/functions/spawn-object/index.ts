import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { communityId, objectType, position, properties } = await req.json();

    console.log('Spawning object:', { communityId, objectType, position, properties });

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the JWT token (optional for guests)
    const authHeader = req.headers.get('Authorization');
    
    // Create a client with or without user token
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      authHeader ? {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      } : undefined
    );

    // Get current user (may be null for guests)
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    let userData = null;
    
    if (user) {
      // Authenticated user - get their internal ID
      const { data: userLookup, error: userDataError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userDataError || !userLookup) {
        console.error('User lookup error:', userDataError);
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        );
      }
      userData = userLookup;
    } else {
      // Guest user - no authentication needed
      console.log('Guest user detected, allowing creation in public communities');
    }

    // Validate object type
    const validObjectTypes = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'custom-model'];
    if (!validObjectTypes.includes(objectType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid object type' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Insert the new world object using the user client to respect RLS
    const { data: worldObject, error: insertError } = await userClient
      .from('world_objects')
      .insert({
        community_id: communityId,
        object_type: objectType,
        position: position,
        properties: {
          color: properties.color || '#00ff00',
          scale: properties.scale || { x: 1, y: 1, z: 1 },
          glbUrl: properties.glbUrl || null,
          name: properties.name || null,
          physics: {
            collisionType: properties.physics?.collisionType || 'solid',
            mass: properties.physics?.mass || 1,
            friction: properties.physics?.friction || 0.3,
            restitution: properties.physics?.restitution || 0.3,
            isStatic: properties.physics?.isStatic || false,
            interactivity: {
              canJumpOn: properties.physics?.interactivity?.canJumpOn || true,
              canPushAround: properties.physics?.interactivity?.canPushAround || true,
              triggersEvents: properties.physics?.interactivity?.triggersEvents || false
            }
          }
        },
        created_by: userData ? userData.id : null // null for guests, user ID for authenticated users
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to spawn object', details: insertError.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Object spawned successfully:', worldObject);

    return new Response(
      JSON.stringify(worldObject),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in spawn-object function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});