import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    const { conversationId, content } = await req.json();

    if (!conversationId || !content) {
      return new Response(
        JSON.stringify({ error: "conversationId and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get conversation to find phone and unit_id
    const { data: conversation, error: convError } = await supabase
      .from("whatsapp_conversations")
      .select("id, phone, unit_id")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has access to this unit
    const { data: hasAccess } = await supabase.rpc("has_unit_access", {
      _user_id: userId,
      _unit_id: conversation.unit_id,
    });

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "No access to this unit" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get WhatsApp settings for the unit
    const { data: settings } = await supabase
      .from("whatsapp_settings")
      .select("api_url, api_token, instance_name")
      .eq("unit_id", conversation.unit_id)
      .maybeSingle();

    // Insert message into database
    const { data: message, error: msgError } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content,
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Update conversation's last_message
    await supabase
      .from("whatsapp_conversations")
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    // Send via Evolution API if configured
    let sentViaApi = false;
    if (settings?.api_url && settings?.api_token && settings?.instance_name) {
      try {
        // Clean phone number - only digits, no @s.whatsapp.net
        const cleanPhone = conversation.phone.replace(/\D/g, "");

        const response = await fetch(
          `${settings.api_url}/message/sendText/${settings.instance_name}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: settings.api_token,
            },
            body: JSON.stringify({
              number: cleanPhone,
              text: content,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          sentViaApi = true;
          console.log(`[SEND-WA] Message sent to ${cleanPhone} via Evolution API, messageId: ${data.key?.id || "unknown"}`);

          // Update message with external message_id
          if (data.key?.id) {
            await supabase
              .from("whatsapp_messages")
              .update({ message_id: data.key.id, status: "sent" })
              .eq("id", message.id);
          }
        } else {
          const errorText = await response.text();
          console.error(`[SEND-WA] Evolution API error: ${response.status} - ${errorText}`);
        }
      } catch (apiError) {
        console.error("[SEND-WA] Failed to send via Evolution API:", apiError);
      }
    } else {
      console.log("[SEND-WA] Evolution API not configured for unit, message saved to DB only");
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: message.id,
        sentViaApi,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[SEND-WA] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
