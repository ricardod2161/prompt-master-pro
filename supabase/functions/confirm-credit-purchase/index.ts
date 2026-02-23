import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnon);

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate Stripe session
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Pagamento não confirmado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate metadata
    const meta = session.metadata;
    if (!meta || meta.type !== "marketing_credits" || meta.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Sessão inválida para este usuário" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const unitId = meta.unit_id;
    const creditsAmount = parseInt(meta.credits || "0");

    if (!unitId || creditsAmount <= 0) {
      return new Response(JSON.stringify({ error: "Dados da sessão incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify unit access
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: hasAccess } = await serviceClient.rpc("has_unit_access", {
      _user_id: userId,
      _unit_id: unitId,
    });
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Sem acesso a esta unidade" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if credits were already added for this session (idempotency)
    const { data: existing } = await serviceClient
      .from("credit_transactions")
      .select("id")
      .eq("description", `stripe_session:${sessionId}`)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ credits: creditsAmount, alreadyProcessed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add credits
    await serviceClient.rpc("add_marketing_credits", {
      _unit_id: unitId,
      _user_id: userId,
      _amount: creditsAmount,
      _description: `stripe_session:${sessionId}`,
    });

    console.log(`[CONFIRM-CREDIT] Added ${creditsAmount} credits for unit ${unitId}, session ${sessionId}`);

    return new Response(JSON.stringify({ credits: creditsAmount, alreadyProcessed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("confirm-credit-purchase error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
