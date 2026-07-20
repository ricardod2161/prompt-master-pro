import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chatWithFallback } from "../_shared/ai-with-fallback.ts";
import { aiGateBlockedResponse } from "../_shared/ai-wallet.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function requireAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = await requireAuth(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { messages, systemPrompt } = await req.json();

    if (!systemPrompt?.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt de sistema é obrigatório para simular." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!messages?.length) {
      return new Response(
        JSON.stringify({ error: "Envie pelo menos uma mensagem." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const result = await chatWithFallback({
        functionName: "test-bot-chat",
        systemSlug: "whatsapp",
        preferredModel: "google/gemini-2.5-flash",
        openaiFallbackModel: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as any,
            content: m.content,
          })),
        ],
        maxTokens: 1500,
      });

      return new Response(
        JSON.stringify({ text: result.text, provider: result.provider, model: result.model }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e: any) {
      if (typeof e?.message === "string" && e.message.startsWith("AI_GATE_BLOCKED")) {
        return aiGateBlockedResponse({ ok: false, reason: e.code ?? "SYSTEM_BLOCKED", available: e.available ?? 0 }, corsHeaders);
      }
      const msg = e instanceof Error ? e.message : String(e);
      console.error("test-bot-chat error:", msg);
      return new Response(
        JSON.stringify({ error: "Erro no gateway de IA.", detail: msg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("test-bot-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
