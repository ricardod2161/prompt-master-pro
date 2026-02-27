import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function transcribeAudio(base64Audio: string, mimetype: string): Promise<string | null> {
  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return null;
    }

    const mimeToExt: Record<string, string> = {
      "audio/ogg": "ogg",
      "audio/ogg; codecs=opus": "ogg",
      "audio/mpeg": "mp3",
      "audio/mp4": "mp4",
      "audio/webm": "webm",
      "audio/wav": "wav",
    };

    const ext = mimeToExt[mimetype] || "ogg";
    const dataUrl = `data:${mimetype};base64,${base64Audio}`;

    const response = await fetch("https://router.lovable.app/api/v1/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        audio: dataUrl,
        format: ext,
        language: "pt",
      }),
    });

    if (!response.ok) {
      // Fallback: use Gemini vision for audio transcription
      const geminiResponse = await fetch(
        "https://router.lovable.app/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Transcreva com precisão o áudio abaixo. Retorne APENAS a transcrição, sem explicações adicionais. Se não conseguir transcrever, retorne null.",
                  },
                  {
                    type: "image_url",
                    image_url: { url: dataUrl },
                  },
                ],
              },
            ],
            max_tokens: 500,
          }),
        }
      );

      if (!geminiResponse.ok) return null;
      const geminiData = await geminiResponse.json();
      const text = geminiData.choices?.[0]?.message?.content?.trim();
      return text && text !== "null" ? text : null;
    }

    const data = await response.json();
    return data.text || null;
  } catch (error) {
    console.error("Transcription error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { log_id } = await req.json();
    if (!log_id) {
      return new Response(JSON.stringify({ error: "log_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the log
    const { data: log, error: fetchError } = await serviceClient
      .from("audio_transcription_logs")
      .select("*")
      .eq("id", log_id)
      .single();

    if (fetchError || !log) {
      return new Response(JSON.stringify({ error: "Log not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user has access to this unit
    const { data: unitAccess } = await userClient
      .from("user_units")
      .select("id")
      .eq("unit_id", log.unit_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!unitAccess) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!log.audio_base64) {
      // Mark as expired if no audio data
      await serviceClient
        .from("audio_transcription_logs")
        .update({
          status: "failed",
          failure_reason: "audio_data_expired",
          retry_count: (log.retry_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", log_id);

      return new Response(
        JSON.stringify({ success: false, error: "Audio data expired, cannot retry" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as retrying
    await serviceClient
      .from("audio_transcription_logs")
      .update({ status: "retried", updated_at: new Date().toISOString() })
      .eq("id", log_id);

    // Attempt transcription
    const transcription = await transcribeAudio(
      log.audio_base64,
      log.mimetype || "audio/ogg"
    );

    if (transcription) {
      // Update the log as success
      await serviceClient
        .from("audio_transcription_logs")
        .update({
          status: "success",
          transcription_result: transcription,
          retry_count: (log.retry_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", log_id);

      // If we have a conversation_id + message_id, update the whatsapp_message
      if (log.conversation_id && log.message_id) {
        await serviceClient
          .from("whatsapp_messages")
          .update({ transcription })
          .eq("message_id", log.message_id)
          .eq("conversation_id", log.conversation_id);
      }

      return new Response(
        JSON.stringify({ success: true, transcription }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Transcription failed again
      await serviceClient
        .from("audio_transcription_logs")
        .update({
          status: "failed",
          failure_reason: "retry_transcription_failed",
          retry_count: (log.retry_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", log_id);

      return new Response(
        JSON.stringify({ success: false, error: "Transcription failed again" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("retry-audio-transcription error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
