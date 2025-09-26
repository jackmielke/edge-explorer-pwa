import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { messages, systemPrompt, stream, communityId } = await req.json();
    console.log('Received request:', { messages: messages?.length, systemPrompt: systemPrompt?.slice(0, 100), stream, communityId });
    
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    console.log('Making request to OpenRouter with GPT-5');

    const requestBody = {
      model: 'openai/gpt-5',
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
        ...messages
      ],
      stream: stream || false,
      tools: [
        {
          type: 'function',
          function: {
            name: 'changeSkyColor',
            description: 'Change the sky color in the game world. Use this when users ask to change the sky color or make it a specific color.',
            parameters: {
              type: 'object',
              properties: {
                skyColor: {
                  type: 'string',
                  description: 'The hex color code for the sky (e.g., #87CEEB for sky blue, #FF69B4 for hot pink, #800080 for purple)',
                  pattern: '^#[0-9A-Fa-f]{6}$'
                },
                description: {
                  type: 'string',
                  description: 'A brief description of the color change for the user'
                }
              },
              required: ['skyColor', 'description']
            }
          }
        }
      ],
      tool_choice: 'auto'
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Lovable Chat App'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Handle function calls
    if (data.choices?.[0]?.message?.tool_calls) {
      const toolCall = data.choices[0].message.tool_calls[0];
      
      if (toolCall.function.name === 'changeSkyColor') {
        const { skyColor, description } = JSON.parse(toolCall.function.arguments);
        
        // Call the update-sky-color function
        const updateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/update-sky-color`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({ communityId, skyColor })
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResult.success) {
          // Return success message
          return new Response(JSON.stringify({
            choices: [{
              message: {
                role: 'assistant',
                content: `✨ ${description} I've changed the sky to ${skyColor}! The new sky color is now active for everyone in your community.`
              }
            }]
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({
            choices: [{
              message: {
                role: 'assistant',
                content: `❌ Sorry, I couldn't change the sky color: ${updateResult.error}`
              }
            }]
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    if (stream) {
      // Handle streaming response
      const stream = new ReadableStream({
        start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  controller.close();
                  break;
                }
                controller.enqueue(value);
              }
            } catch (error) {
              console.error('Streaming error:', error);
              controller.error(error);
            }
          };

          pump();
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Handle non-streaming response
      console.log('OpenRouter response received');
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in chat-with-gpt5 function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});