import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { communityId, skyColor } = await req.json();
    
    console.log('Updating sky color for community:', communityId, 'to:', skyColor);
    
    if (!communityId || !skyColor) {
      throw new Error('Community ID and sky color are required');
    }

    // Validate hex color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(skyColor)) {
      throw new Error('Invalid hex color format. Use #RRGGBB format.');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the community's sky color
    const { data, error } = await supabase
      .from('communities')
      .update({ game_design_sky_color: skyColor })
      .eq('id', communityId)
      .select();

    if (error) {
      console.error('Error updating sky color:', error);
      throw error;
    }

    console.log('Sky color updated successfully:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      skyColor,
      message: `Sky color changed to ${skyColor}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in update-sky-color function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});