import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { action, tableId } = await req.json();
    if (!tableId || !UUID_RE.test(tableId)) return json({ error: "tableId inválido" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "get_table") {
      const { data, error } = await admin
        .from("tables")
        .select("id, number, status, unit_id, unit:units(id, name, address, phone)")
        .eq("id", tableId)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json({ table: data });
    }

    if (action === "get_bill") {
      const [ordersRes, paymentsRes] = await Promise.all([
        admin
          .from("orders")
          .select("*, order_items(*)")
          .eq("table_id", tableId)
          .in("status", ["pending", "preparing", "ready", "delivered"])
          .order("created_at", { ascending: true }),
        admin
          .from("bill_payments")
          .select("*")
          .eq("table_id", tableId)
          .order("created_at", { ascending: true }),
      ]);
      if (ordersRes.error) return json({ error: ordersRes.error.message }, 500);
      return json({ orders: ordersRes.data ?? [], payments: paymentsRes.data ?? [] });
    }

    return json({ error: "action inválida" }, 400);
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
