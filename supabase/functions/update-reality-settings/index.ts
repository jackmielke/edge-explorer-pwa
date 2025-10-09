import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { communityId, gravity, timeScale } = await req.json();

    if (!communityId) {
      throw new Error('Community ID is required');
    }

    // Update community reality settings
    const { data, error } = await supabase
      .from('communities')
      .update({
        game_design_gravity_y: gravity,
        game_design_time_scale: timeScale,
      })
      .eq('id', communityId)
      .select()
      .single();

    if (error) throw error;

    console.log(`Updated reality settings for community ${communityId}:`, {
      gravity,
      timeScale,
    });

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating reality settings:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
