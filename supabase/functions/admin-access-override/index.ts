import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) throw new Error("Invalid token");

    const callerId = claimsData.claims.sub as string;

    // Verify caller is developer using service role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "developer")
      .maybeSingle();

    if (!roleData) throw new Error("Forbidden: developer role required");

    const body = await req.json();
    const { action, user_id, tier, days, notes } = body;

    if (!action || !user_id) throw new Error("Missing action or user_id");

    if (action === "grant") {
      // Revoke any existing active overrides first
      await serviceClient
        .from("access_overrides")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("user_id", user_id)
        .eq("is_active", true);

      const expires_at = days
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await serviceClient
        .from("access_overrides")
        .insert({
          user_id,
          tier: tier || "pro",
          granted_by: callerId,
          expires_at,
          is_active: true,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, override: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "revoke") {
      const { error } = await serviceClient
        .from("access_overrides")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("user_id", user_id)
        .eq("is_active", true);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "list") {
      const { data, error } = await serviceClient
        .from("access_overrides")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ overrides: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
