import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageTimestamp?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: EvolutionWebhookPayload = await req.json();
    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    // Only process incoming messages (not from us)
    if (payload.event !== "messages.upsert" || payload.data.key.fromMe) {
      return new Response(JSON.stringify({ status: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instanceName = payload.instance;
    const phone = payload.data.key.remoteJid.replace("@s.whatsapp.net", "");
    const customerName = payload.data.pushName || "Cliente";
    const messageText =
      payload.data.message?.conversation ||
      payload.data.message?.extendedTextMessage?.text ||
      "";

    if (!messageText) {
      return new Response(JSON.stringify({ status: "no_text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find WhatsApp settings by instance name
    const { data: settings, error: settingsError } = await supabase
      .from("whatsapp_settings")
      .select("*")
      .eq("instance_name", instanceName)
      .single();

    if (settingsError || !settings) {
      console.error("Settings not found for instance:", instanceName);
      return new Response(JSON.stringify({ error: "Settings not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if bot is enabled globally
    if (!settings.bot_enabled) {
      console.log("Bot is disabled globally");
      return new Response(JSON.stringify({ status: "bot_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find or create conversation
    let { data: conversation, error: convError } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("unit_id", settings.unit_id)
      .eq("phone", phone)
      .single();

    if (convError && convError.code === "PGRST116") {
      // Conversation doesn't exist, create it
      const { data: newConv, error: createError } = await supabase
        .from("whatsapp_conversations")
        .insert({
          unit_id: settings.unit_id,
          phone,
          customer_name: customerName,
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          is_bot_active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating conversation:", createError);
        throw createError;
      }
      conversation = newConv;

      // Send welcome message if configured
      if (settings.welcome_message) {
        await sendWhatsAppMessage(
          settings.api_url,
          settings.api_token,
          instanceName,
          phone,
          settings.welcome_message
        );
      }
    } else if (convError) {
      throw convError;
    } else {
      // Update existing conversation
      await supabase
        .from("whatsapp_conversations")
        .update({
          customer_name: customerName,
          last_message: messageText,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversation.id);
    }

    // Check if bot is active for this conversation
    if (!conversation?.is_bot_active) {
      console.log("Bot is disabled for this conversation");
      return new Response(JSON.stringify({ status: "bot_disabled_conversation" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get recent conversation history for context
    const { data: recentMessages } = await supabase
      .from("whatsapp_messages")
      .select("role, content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Build messages array for AI
    const systemPrompt = settings.system_prompt || `Você é um assistente virtual de atendimento ao cliente de um restaurante. 
Seja cordial, prestativo e objetivo nas respostas.
Ajude com informações sobre o cardápio, horários de funcionamento, pedidos e reservas.
Responda sempre em português brasileiro.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(recentMessages || []).reverse().map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: messageText },
    ];

    // Store user message
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conversation.id,
      role: "user",
      content: messageText,
    });

    // Generate AI response using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          max_tokens: 500,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage =
      aiData.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

    // Store assistant message
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conversation.id,
      role: "assistant",
      content: assistantMessage,
    });

    // Send response via Evolution API
    await sendWhatsAppMessage(
      settings.api_url,
      settings.api_token,
      instanceName,
      phone,
      assistantMessage
    );

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Response sent",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function sendWhatsAppMessage(
  apiUrl: string,
  apiToken: string,
  instanceName: string,
  phone: string,
  message: string
): Promise<void> {
  const response = await fetch(
    `${apiUrl}/message/sendText/${instanceName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiToken,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error sending WhatsApp message:", response.status, errorText);
    throw new Error(`Failed to send WhatsApp message: ${response.status}`);
  }

  console.log("WhatsApp message sent successfully to:", phone);
}
