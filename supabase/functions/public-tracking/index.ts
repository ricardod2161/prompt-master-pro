import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[a-f0-9]{16,128}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return json({ error: "Token inválido" }, 400);
    }
    const isUuid = UUID_RE.test(token);
    if (!isUuid && !TOKEN_RE.test(token)) {
      return json({ error: "Token inválido" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const filter = isUuid
      ? `id.eq.${token},tracking_token.eq.${token}`
      : `tracking_token.eq.${token}`;

    const { data: order, error } = await admin
      .from("orders")
      .select(
        `id, order_number, status, total_price, customer_name, channel, created_at, table_id, unit_id, tracking_token,
         order_items ( id, product_name, quantity, unit_price, total_price ),
         tables ( number )`,
      )
      .or(filter)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!order) return json({ order: null }, 200);

    const [{ data: unitSettings }, { data: unitInfo }, { data: pix }] = await Promise.all([
      admin
        .from("unit_settings")
        .select("pix_key, pix_merchant_name, pix_merchant_city, currency")
        .eq("unit_id", order.unit_id)
        .maybeSingle(),
      admin
        .from("units")
        .select("id, name, address")
        .eq("id", order.unit_id)
        .maybeSingle(),
      admin
        .from("pix_transactions")
        .select("id, pix_code, amount, status, expires_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return json({
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_price: order.total_price,
        customer_name: order.customer_name,
        channel: order.channel,
        created_at: order.created_at,
        table_id: order.table_id,
        unit_id: order.unit_id,
        items: order.order_items || [],
        table_number: (order as any).tables?.number ?? null,
      },
      unitSettings,
      unitInfo,
      pix,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
