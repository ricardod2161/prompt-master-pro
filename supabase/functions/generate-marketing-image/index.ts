import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const styleMap: Record<string, string> = {
  modern: "Clean, modern, minimalist design with sleek typography, soft gradients, and contemporary layout",
  rustic: "Warm rustic artisanal style with wooden textures, handwritten fonts, earthy tones, and cozy atmosphere",
  premium: "Luxurious premium elegant style with gold accents, dark background, serif typography, and sophisticated lighting",
  vibrant: "Bold colorful vibrant style with bright saturated colors, dynamic composition, playful typography, and energetic mood",
};

const campaignMap: Record<string, string> = {
  promotion: "special promotional offer with discount emphasis",
  daily_menu: "daily menu or chef's special highlight",
  inauguration: "grand opening or inauguration celebration",
  delivery: "food delivery service advertisement",
  event: "special event or themed night",
  holiday: "seasonal holiday celebration",
  system: "restaurant management system or SaaS platform screenshot mockup, showing a modern tech interface with dashboard, charts, and clean UI elements for a B2B Facebook campaign",
};

const formatMap: Record<string, string> = {
  feed: "square 1:1 aspect ratio optimized for social media feed",
  cover: "wide 1200x630 landscape format for Facebook cover or link preview",
  story: "tall 9:16 portrait format for Instagram/Facebook stories",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT via getClaims
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Não autorizado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnon);
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      throw new Error("Token inválido");
    }

    const userId = claimsData.claims.sub as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { unitId, campaignType, title, description, format, style, restaurantName, customPrompt, promptHint } = await req.json();

    if (!unitId || !campaignType || !title || !format || !style) {
      throw new Error("Campos obrigatórios faltando");
    }

    // Verify unit access
    const { data: hasAccess } = await supabase.rpc("has_unit_access", {
      _user_id: userId,
      _unit_id: unitId,
    });
    if (!hasAccess) throw new Error("Sem acesso a esta unidade");

    // Check and consume credit
    const { data: creditConsumed, error: creditError } = await supabase.rpc("consume_marketing_credit", {
      _unit_id: unitId,
      _user_id: userId,
    });

    if (creditError) {
      console.error("Credit check error:", creditError);
      throw new Error("Erro ao verificar créditos");
    }

    if (!creditConsumed) {
      return new Response(JSON.stringify({ 
        error: "Créditos esgotados. Compre mais créditos para continuar gerando imagens.",
        code: "NO_CREDITS"
      }), {
        status: 402, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    let prompt: string;

    if (customPrompt) {
      prompt = customPrompt;
    } else {
      const styleDesc = styleMap[style] || styleMap.modern;
      const campaignDesc = campaignMap[campaignType] || campaignType;
      const formatDesc = formatMap[format] || formatMap.feed;

      prompt = `Create a professional, high-quality restaurant marketing image for a Facebook campaign.

Visual Style: ${styleDesc}
Campaign Type: ${campaignDesc}
Restaurant Name: "${restaurantName || 'Restaurante'}"
Headline: "${title}"
${description ? `Details: "${description}"` : ""}
Format: ${formatDesc}
${promptHint ? `\nCreative Direction: ${promptHint}` : ""}

Requirements:
- Professional food photography style with appetizing presentation
- Warm, inviting lighting that makes food look delicious
- Clean professional typography overlay with the headline text
- Cohesive color palette matching the chosen style
- High contrast and vibrant colors optimized for social media
- Modern layout with clear visual hierarchy

Do NOT include:
- Misspelled text or garbled characters
- Watermarks or logos
- Low quality or blurry elements
- Generic clip art style graphics`;
    }

    console.log("Generating marketing image with prompt:", prompt.substring(0, 200));

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para geração de imagem." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Falha ao gerar imagem");
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in AI response:", JSON.stringify(aiData).substring(0, 500));
      throw new Error("Nenhuma imagem foi gerada. Tente novamente.");
    }

    const base64Match = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!base64Match) throw new Error("Formato de imagem inválido");

    const imageType = base64Match[1];
    const base64Data = base64Match[2];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const fileName = `${userId}/${Date.now()}-${campaignType}.${imageType}`;
    const { error: uploadError } = await supabase.storage
      .from("marketing-images")
      .upload(fileName, imageBytes, { contentType: `image/${imageType}`, upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Falha ao salvar imagem");
    }

    const { data: urlData } = supabase.storage.from("marketing-images").getPublicUrl(fileName);
    const imageUrl = urlData.publicUrl;

    await supabase.from("marketing_images").insert({
      unit_id: unitId,
      user_id: userId,
      image_url: imageUrl,
      prompt_used: prompt,
      campaign_type: campaignType,
      format,
      style,
      title,
    });

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-marketing-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
