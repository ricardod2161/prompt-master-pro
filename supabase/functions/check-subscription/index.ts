import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    
    // Use service key getUser for reliable email retrieval
    const serviceClientForAuth = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } = await serviceClientForAuth.auth.getUser(token);
    if (userError || !userData?.user?.email) {
      throw new Error("Authentication error: invalid token or missing email");
    }
    
    const userId = userData.user.id;
    const userEmail = userData.user.email;
    logStep("User authenticated", { userId, email: userEmail });

    // ✅ CHECK OVERRIDE FIRST — manual override always wins over Stripe
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: override } = await serviceClient
      .from("access_overrides")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (override) {
      logStep("Manual access override found — returning override tier immediately", { tier: override.tier, expires_at: override.expires_at });
      return new Response(JSON.stringify({
        subscribed: true,
        tier: override.tier,
        productId: null,
        subscriptionEnd: override.expires_at,
        status: "manual_override",
        isTrialing: false,
        trialEnd: null,
        isManualOverride: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("No override found, checking Stripe");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: null,
        productId: null,
        subscriptionEnd: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    const validSubscription = subscriptions.data.find(
      (sub: { status: string }) => sub.status === 'active' || sub.status === 'trialing'
    );

    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let tier: string | null = null;
    let status: string | null = null;
    let isTrialing = false;
    let trialEnd: string | null = null;

    if (validSubscription) {
      const subscription = validSubscription;
      status = subscription.status;
      isTrialing = subscription.status === 'trialing';
      subscriptionEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null;
      productId = subscription.items.data[0].price.product as string;
      
      const tierMap: Record<string, string> = {
        "prod_TulLmt1sNhS2L2": "starter",
        "prod_TulNDUheGUqxbB": "pro",
        "prod_TulNrqfw5s4Hp9": "enterprise"
      };
      
      tier = tierMap[productId] || null;
      
      logStep("Valid subscription found", { 
        subscriptionId: subscription.id, 
        status,
        isTrialing,
        trialEnd,
        endDate: subscriptionEnd,
        productId,
        tier
      });
    } else {
      logStep("No valid subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: !!validSubscription,
      tier,
      productId,
      subscriptionEnd,
      status,
      isTrialing,
      trialEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
