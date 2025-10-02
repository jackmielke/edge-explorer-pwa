import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MESHY_API_KEY = Deno.env.get("MESHY_API_KEY");
    if (!MESHY_API_KEY) {
      throw new Error("MESHY_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { 
      action, 
      imageBase64, 
      taskId,
      aiModel = "latest",
      topology = "triangle",
      targetPolycount = 30000,
      shouldTexture = true,
      enablePbr = true,
      texturePrompt,
      symmetryMode = "auto",
      shouldRemesh = true,
    } = body;

    // Test connection
    if (action === "test") {
      console.log("Testing Meshy API connection");
      return new Response(JSON.stringify({ success: true, message: "API key configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check task status
    if (action === "status" && taskId) {
      console.log("Checking status for task:", taskId);
      
      const statusResponse = await fetch(`https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${MESHY_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("Meshy status check error:", errorText);
        throw new Error(`Meshy API error: ${statusResponse.status} - ${errorText}`);
      }

      const statusData = await statusResponse.json();
      console.log("Task status:", statusData);

      return new Response(JSON.stringify(statusData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Start new generation
    if (!imageBase64) {
      throw new Error("Missing imageBase64");
    }

    console.log("Starting 3D model generation");

    // Upload image to Supabase Storage first to get a public URL
    const timestamp = Date.now();
    const fileName = `${timestamp}.png`;
    const imageBuffer = Uint8Array.from(atob(imageBase64.split(",")[1]), c => c.charCodeAt(0));

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("character-models")
      .upload(`source-images/${fileName}`, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from("character-models")
      .getPublicUrl(`source-images/${fileName}`);

    console.log("Image uploaded to:", publicUrl);

    // Build request body for Meshy API
    const meshyRequestBody: any = {
      image_url: publicUrl,
      ai_model: aiModel,
      topology,
      target_polycount: targetPolycount,
      should_texture: shouldTexture,
      symmetry_mode: symmetryMode,
      should_remesh: shouldRemesh,
    };

    if (shouldTexture) {
      meshyRequestBody.enable_pbr = enablePbr;
      if (texturePrompt) {
        meshyRequestBody.texture_prompt = texturePrompt;
      }
    }

    console.log("Starting generation with params:", meshyRequestBody);

    // Call Meshy API
    const meshyResponse = await fetch("https://api.meshy.ai/openapi/v1/image-to-3d", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MESHY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(meshyRequestBody),
    });

    if (!meshyResponse.ok) {
      const errorText = await meshyResponse.text();
      console.error("Meshy API error:", errorText);
      throw new Error(`Meshy API error: ${meshyResponse.status} - ${errorText}`);
    }

    const meshyData = await meshyResponse.json();
    console.log("Meshy task created:", meshyData);

    return new Response(JSON.stringify(meshyData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-3d-model function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
