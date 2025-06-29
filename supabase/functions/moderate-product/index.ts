
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Admin client to bypass RLS for checking duplicates
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function checkDuplicates(title: string): Promise<{ isDuplicate: boolean; message: string }> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id')
    .ilike('title', title.trim());

  if (error) {
    console.error("Error checking for duplicates:", error);
    return { isDuplicate: false, message: "Could not check for duplicates." };
  }

  if (data && data.length > 0) {
    return { isDuplicate: true, message: "Un producto con un título idéntico ya existe." };
  }

  return { isDuplicate: false, message: "" };
}

async function checkOpenAIModeration(text: string): Promise<{ isFlagged: boolean; message: string }> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.warn("OPENAI_API_KEY is not set. Moderation will be skipped.");
    return { isFlagged: false, message: "OpenAI moderation not configured." };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorBody}`);
    }

    const { results } = await response.json();
    const [result] = results;

    if (result.flagged) {
        const flaggedCategories = Object.entries(result.categories)
            .filter(([, value]) => value === true)
            .map(([key]) => key.replace(/_/g, ' '))
            .join(', ');
      return { isFlagged: true, message: `El contenido fue marcado como inapropiado por: ${flaggedCategories}.` };
    }

    return { isFlagged: false, message: "" };
  } catch (error) {
    console.error('Error with OpenAI moderation:', error);
    return { isFlagged: false, message: "Error during moderation check." };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description } = await req.json();

    if (!title || !description) {
      return new Response(JSON.stringify({ error: 'Title and description are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const duplicateCheck = await checkDuplicates(title);
    if (duplicateCheck.isDuplicate) {
      return new Response(JSON.stringify({ safe: false, reason: duplicateCheck.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const combinedText = `${title}\n\n${description}`;
    const moderationCheck = await checkOpenAIModeration(combinedText);
    if (moderationCheck.isFlagged) {
      return new Response(JSON.stringify({ safe: false, reason: moderationCheck.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    return new Response(JSON.stringify({ safe: true, reason: 'El producto pasó la moderación.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
